import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['surveys'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      surveysGetStateV1: build.query<SurveysGetStateV1ApiResponse, SurveysGetStateV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/spaces/${queryArg.spaceId}/surveys/${queryArg.slug}/state` }),
        providesTags: ['surveys'],
      }),
      surveysSubmitResponseV1: build.mutation<SurveysSubmitResponseV1ApiResponse, SurveysSubmitResponseV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/surveys/${queryArg.slug}/responses`,
          method: 'POST',
          body: queryArg.submitSurveyResponseDto,
        }),
        invalidatesTags: ['surveys'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type SurveysGetStateV1ApiResponse = /** status 200  */ SurveyStateDto
export type SurveysGetStateV1ApiArg = {
  /** Space UUID to get survey state for */
  spaceId: string
  slug: string
}
export type SurveysSubmitResponseV1ApiResponse = /** status 201  */ SurveyResponseResultDto
export type SurveysSubmitResponseV1ApiArg = {
  /** Space UUID to submit a survey response for */
  spaceId: string
  slug: string
  submitSurveyResponseDto: SubmitSurveyResponseDto
}
export type SurveyOptionDto = {
  key: string
  label: string
  description?: string
  icon?: string
}
export type SurveyPageDto = {
  id: string
  title: string
  subtitle: string | null
  multiSelect: boolean
  options: SurveyOptionDto[]
}
export type SurveyContentDto = {
  pages: SurveyPageDto[]
}
export type SurveyDto = {
  id: number
  slug: string
  version: number
  title: string
  subtitle: string | null
  surveyContent: SurveyContentDto
}
export type SpaceSurveyResponseDto = {
  surveyVersion: number
  /** Map from page id → selected option keys */
  selections: {
    [key: string]: string[]
  }
  submittedAt: string
  updatedAt: string
  answeredByUserId: number | null
}
export type SurveyStateDto = {
  survey: SurveyDto
  surveyResponse: SpaceSurveyResponseDto | null
}
export type SurveyResponseResultDto = {
  id: number
  /** Space UUID */
  spaceUuid: string
  surveySlug: string
  surveyVersion: number
  selections: {
    [key: string]: string[]
  }
  submittedAt: string
  updatedAt: string
  answeredByUserId: number | null
}
export type SubmitSurveyResponseDto = {
  /** Map from page id → selected option keys */
  selections: {
    [key: string]: string[]
  }
}
export const { useSurveysGetStateV1Query, useLazySurveysGetStateV1Query, useSurveysSubmitResponseV1Mutation } =
  injectedRtkApi
