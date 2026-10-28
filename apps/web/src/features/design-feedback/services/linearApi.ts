const LINEAR_API = 'https://api.linear.app/graphql'

// Reviewers paste a personal Linear API key, which Linear expects as the raw Authorization header.
async function linear<T>(apiKey: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(LINEAR_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: apiKey },
    body: JSON.stringify({ query, variables }),
  })
  const body = (await response.json().catch(() => ({}))) as { data?: T; errors?: { message: string }[] }
  if (!response.ok || body.errors?.length || !body.data)
    throw new Error(body.errors?.[0]?.message ?? `Linear returned ${response.status}`)
  return body.data
}

type ParentIssue = { issue: { id: string; team: { id: string }; project: { id: string } | null } }
type CreatedIssue = { issueCreate: { success: boolean; issue: { id: string; identifier: string; url: string } | null } }
type TeamStates = { issue: { id: string; team: { states: { nodes: { id: string }[] } } } }

export type SubIssue = { identifier: string; url: string }

export async function createSubIssue(
  apiKey: string,
  {
    parent,
    title,
    description,
    pinLink,
  }: { parent: string; title: string; description: string; pinLink: (issue: string) => string },
): Promise<SubIssue> {
  const { issue } = await linear<ParentIssue>(
    apiKey,
    'query Parent($id: String!) { issue(id: $id) { id team { id } project { id } } }',
    { id: parent },
  )
  const { issueCreate } = await linear<CreatedIssue>(
    apiKey,
    'mutation Create($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id identifier url } } }',
    { input: { teamId: issue.team.id, parentId: issue.id, projectId: issue.project?.id, title, description } },
  )
  const created = issueCreate.issue
  if (!issueCreate.success || !created) throw new Error('Linear did not create the issue')

  // The pin link can only carry the issue number once the issue exists. If this fails, the description link still works.
  await linear(
    apiKey,
    'mutation Link($input: AttachmentCreateInput!) { attachmentCreate(input: $input) { success } }',
    { input: { issueId: created.id, url: pinLink(created.identifier), title: 'Open pinned spot' } },
  ).catch(() => undefined)

  return { identifier: created.identifier, url: created.url }
}

export async function completeIssue(apiKey: string, identifier: string): Promise<void> {
  const { issue } = await linear<TeamStates>(
    apiKey,
    'query Done($id: String!) { issue(id: $id) { id team { states(filter: { type: { eq: "completed" } }) { nodes { id } } } } }',
    { id: identifier },
  )
  const stateId = issue.team.states.nodes[0]?.id
  if (!stateId) throw new Error('The team has no done state')
  await linear(
    apiKey,
    'mutation Done($id: String!, $input: IssueUpdateInput!) { issueUpdate(id: $id, input: $input) { success } }',
    {
      id: issue.id,
      input: { stateId },
    },
  )
}
