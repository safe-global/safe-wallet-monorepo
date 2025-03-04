# Code Style Guidelines

## Code Structure

### General Components

- Components that are used across multiple features should reside in the `src/components/` folder.
- Each component should have its own folder, structured as follows:
  ```
  Alert/
  - Alert.tsx
  - Alert.test.tsx
  - Alert.stories.tsx
  - index.tsx
  ```
- The main component implementation should be in a named file (e.g., `Alert.tsx`), and `index.tsx` should only be used for exporting the component.
- **Reason**: Using `index.tsx` allows for cleaner imports, e.g.,
  ```
  import { Alert } from 'src/components/Alert';
  ```
  instead of:
  ```
  import { Alert } from 'src/components/Alert/Alert';
  ```

### Exporting Components

- **Always prefer named exports over default exports.**
  - Named exports make it easier to refactor and identify exports in a codebase.

### Features and Screens

- Feature-specific components and screens should be implemented inside the `src/features/` folder.

#### Example: Feature File Structure

For a feature called **Assets**, the file structure might look like this:

```
// src/features/Assets
- Assets.container.tsx
- index.tsx
```

- `index.tsx` should only export the **Assets** component/container.

#### Subcomponents for Features

- If a feature depends on multiple subcomponents unique to that feature, place them in a `components` subfolder. For example:

```
// src/features/Assets/components/AssetHeader
- AssetHeader.tsx
- AssetHeader.container.tsx
- index.tsx
```

### Presentation vs. Container Components

- **Presentation Components**:

  - Responsible only for rendering the UI.
  - Receive data and callbacks via props.
  - Avoid direct manipulation of business logic.
  - Simple business logic can be included but should generally be extracted into hooks.

- **Container Components**:
  - Handle business logic (e.g., state management, API calls, etc.).
  - Pass necessary data and callbacks to the corresponding Presentation component.
