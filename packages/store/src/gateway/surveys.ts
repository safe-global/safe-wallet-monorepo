/**
 * Manual RTK Query endpoint injection for the CGW surveys module.
 *
 * Replace with AUTO_GENERATED/surveys.ts once CGW is deployed and the
 * OpenAPI schema is fetched + regenerated:
 *   yarn workspace @safe-global/store fetch-schema
 *   yarn workspace @safe-global/store generate-api
 *
 * Backend endpoints (see safe-client-gateway src/modules/surveys/):
 *   GET  /v1/spaces/:spaceId/surveys/:slug/state
 *   POST /v1/spaces/:spaceId/surveys/:slug/responses
 *
 * survey_content is structured as { pages: [...] } so future multi-page
 * surveys add data without breaking the Mixpanel event property schema.
 */
import { cgwClient as api } from './cgwClient'

export type SurveyOption = {
  key: string
  label: string
  description?: string
  icon?: string
}

export type SurveyPage = {
  id: string
  title: string
  subtitle?: string | null
  multiSelect: boolean
  options: SurveyOption[]
}

export type SurveyContent = {
  pages: SurveyPage[]
}

export type SurveyDto = {
  id: number
  slug: string
  version: number
  title: string
  subtitle: string | null
  surveyContent: SurveyContent
}

/** Map from page id → selected option keys on that page. */
export type SurveySelections = Record<string, string[]>

export type SpaceSurveyResponse = {
  surveyVersion: number
  selections: SurveySelections
  submittedAt: string
  updatedAt: string
  answeredByUserId: number | null
}

export type SurveyStateDto = {
  survey: SurveyDto
  spaceResponse: SpaceSurveyResponse | null
}

export type SurveyResponseResultDto = {
  id: number
  spaceId: number
  surveySlug: string
  surveyVersion: number
  selections: SurveySelections
  submittedAt: string
  updatedAt: string
  answeredByUserId: number | null
}

export type SurveysGetStateV1ApiArg = {
  spaceId: number | string
  slug: string
}

export type SurveysSubmitResponseV1ApiArg = {
  spaceId: number | string
  slug: string
  submitSurveyResponseDto: { selections: SurveySelections }
}

// Cache tags are scoped to (spaceId, slug) so a submit only invalidates the
// state query for the affected Space, not every other Space's cached survey.
const surveyTag = (spaceId: number | string, slug: string) => ({ type: 'surveys' as const, id: `${spaceId}:${slug}` })

export const surveysApi = api.enhanceEndpoints({ addTagTypes: ['surveys'] }).injectEndpoints({
  endpoints: (build) => ({
    surveysGetStateV1: build.query<SurveyStateDto, SurveysGetStateV1ApiArg>({
      query: ({ spaceId, slug }) => ({
        url: `/v1/spaces/${spaceId}/surveys/${slug}/state`,
      }),
      providesTags: (_result, _error, { spaceId, slug }) => [surveyTag(spaceId, slug)],
    }),
    surveysSubmitResponseV1: build.mutation<SurveyResponseResultDto, SurveysSubmitResponseV1ApiArg>({
      query: ({ spaceId, slug, submitSurveyResponseDto }) => ({
        url: `/v1/spaces/${spaceId}/surveys/${slug}/responses`,
        method: 'POST',
        body: submitSurveyResponseDto,
      }),
      invalidatesTags: (_result, _error, { spaceId, slug }) => [surveyTag(spaceId, slug)],
    }),
  }),
})

export const { useSurveysGetStateV1Query, useSurveysSubmitResponseV1Mutation } = surveysApi
