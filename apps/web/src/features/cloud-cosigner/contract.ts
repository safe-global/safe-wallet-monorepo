import type CloudCosignerOption from './components/CloudCosignerOption'
import type CloudCosignerBadge from './components/CloudCosignerBadge'
import type CloudCosignerSettings from './components/CloudCosignerSettings'

export interface CloudCosignerContract {
  CloudCosignerOption: typeof CloudCosignerOption
  CloudCosignerBadge: typeof CloudCosignerBadge
  CloudCosignerSettings: typeof CloudCosignerSettings
}
