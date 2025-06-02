# Contributing & Local Installation

## Contributing

Contributions are more than welcome! To get started:

1. **Fork** this repository and create a new **branch** for your feature or bug fix.
2. **Commit** your changes with clear and concise commit messages.
3. Ensure that the code adheres to the project's style guidelines:

   ```bash
   npm run lint:check
   npm run format:check
   ```

4. **Submit a Pull Request (PR)** with a detailed description of your changes and their purpose.

## Local Installation

To set up Paste Perfect locally:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/YourUsername/paste-perfect.git
   cd paste-perfect
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Run the application locally**:

   ```bash
   npm start
   ```

   This will launch the development server at [http://localhost:4200](http://localhost:4200) by default.

## Available Scripts

Here are the relevant `npm` scripts available for development and contribution:

- `npm run start` – Runs the app locally with `ng serve`.
- `npm run build-prod` – Builds the Angular project.
- `npm run build-docker` – Builds the app with a base href for Docker deployment.
- `npm run test` – Runs both unit and end-to-end tests.
- `npm run test:unit` – Runs unit tests.
- `npm run test:e2e` – Runs Playwright end-to-end tests.
- `npm run test:e2e:update-snapshots` – Updates Playwright snapshots.
- `npm run lint:check` – Checks for linting issues.
- `npm run lint:fix` – Automatically fixes linting issues.
- `npm run format:check` – Checks code formatting with Prettier.
- `npm run format:fix` – Automatically formats code with Prettier.
- `npm run prepare` – Sets up Git hooks via Husky.

## Technical Details

This project is built in **Angular**, enhanced by **Prism.js** for syntax highlighting and **PrimeNG** for user interface components. It allows users to type or paste code, choose their preferred language and theme, and then copy a fully formatted snippet to the clipboard.

### Components

1. **`code-input.component`**
   Lets users type or paste source code. It then hands off this raw code to the core services for processing.

2. **`settings.component`**
   Offers controls for language selection, theme, indentation style (tabs, spaces, etc.), and indentation size. These preferences are saved to the browser’s storage for convenience.

3. **`code-output.component`**
   Receives the highlighted code from Prism.js and displays it. It also provides a one-click button to copy the code with all of its colors and indentation settings intact.

### Services

- **`code.service.ts`**
  Holds both the original (raw) code and the fully highlighted version.

- **`language.service.ts`**
  Manages available languages and the user’s current choice. It uses `storage.service.ts` behind the scenes to store this preference in `localStorage`.

- **`theme.service.ts` & `settings.service.ts`**
  Handle visual themes and other editor options—again persisting them via `storage.service.ts`.

- **`prism-lang-loader.service.ts`**
  Dynamically fetches the necessary Prism.js language definitions only when needed (for example, C++ needs C first). This prevents loading all languages at once.

- **`storage.service.ts`**
  Provides straightforward read/write methods for the browser’s `localStorage`.

- **`syntax-highlight.service.ts`**
  The **heart of the application**, responsible for turning raw code into a highlighted snippet and allowing for a properly formatted clipboard copy. It offers two primary methods:

  1. **`highlightCode(code: string, language: LanguageDefinition): Promise<string>`**

     - Sanitizes input (e.g., replaces unsupported characters).
     - Dynamically loads Prism.js language definitions if needed.
     - Returns HTML with syntax-highlighted code using Prism.

  2. **`copyToClipboard()`**

     - Locates the highlighted `<pre><code>` block in the DOM.
     - Clones and processes the node structure to preserve:
       - Inline formatting (e.g., font styles, colors).
       - Line breaks and indentation (tabs or spaces).
     - Converts structure into `<p>` and `<span>` blocks for rich formatting.
     - Outputs two clipboard formats:
       - `text/html`: Styled for pasting into Word, PowerPoint, etc.
       - `text/plain`: Clean text with accurate indentation.

#### Utils

- **IndentationFormatter** – Masks and unmasks indentation
- **InlineStyleApplier** – Captures and reapplies essential font-related styles for inline use.
- **LinesCollector** – Transforms the DOM structure into styled line-by-line paragraphs, while:
  - Masking leading whitespace,
  - Rebuilding indentation with accurate styling (via `IndentationFormatter`),
  - Ensuring Office-friendly formatting (via `OfficeUtils`).
- **NodeUtils** - Reusable utility methods such as generating DOM nodes, add attributes, etc.
- **OfficeUtils** - Utility methods for proper office formatting (i.e., for adding mso-spacerun:yes to preserve whitespaces)
- **Sanitizer** - Sanitizes input and output strings to replace invalid characters

# Contributing & Local Installation

## Contributing

Contributions are always welcome! To get started:

1. **Fork** this repository and create a new **branch** for your feature or bug fix.
2. **Commit** your changes with clear and concise commit messages.
3. Ensure that the code adheres to the project's style guidelines:

   ```bash
   npm run lint:check
   npm run format:check
   ```

4. **Submit a Pull Request (PR)** with a detailed description of your changes and their purpose.

## Local Installation

To set up Paste Perfect locally:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/YourUsername/paste-perfect.git
   cd paste-perfect
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Run the application locally**:

   ```bash
   npm start
   ```

   This will launch the development server at [http://localhost:4200](http://localhost:4200) by default.

## Technical Details

This project is built with **Angular**, enhanced by **Prism.js** for syntax highlighting and **PrimeNG** for user interface components. Users can paste or type code, choose a preferred language and theme, and copy a fully formatted snippet to the clipboard.

### Components

1. **`code-input.component`**

- Allows users to enter or paste source code.
- Sends raw code to the core services for processing.

2. **`settings.component`**

- Provides controls for language selection, theme, and indentation settings.
- Saves preferences in the browser’s storage for persistence.

3. **`code-output.component`**

- Displays highlighted code from Prism.js.
- Offers a one-click button to copy the formatted code.

### Services & Utilities

- **`code.service.ts`**
  Holds both the original (raw) code and the fully highlighted version.

- **`language.service.ts`**
  Manages available languages and the user’s current choice. It uses `storage.service.ts` behind the scenes to store this preference in `localStorage`.

- **`theme.service.ts` & `settings.service.ts`**
  Handle visual themes and other editor options—again persisting them via `storage.service.ts`.

- **`prism-lang-loader.service.ts`**
  Dynamically fetches the necessary Prism.js language definitions only when needed (for example, C++ needs C first). This prevents loading all languages at once.

- **`storage.service.ts`**
  Provides straightforward read/write methods for the browser’s `localStorage`.

- **`syntax-highlight.service.ts`** (Main Highlighting Service)
  - The **heart of the application**, responsible for turning raw code into a highlighted snippet and allowing for a properly formatted clipboard copy.
  - Handles syntax highlighting via Prism.js.
  - Uses `NodeUtils`, `InlineStyleApplier`, and `IndentationFormatter` for better modularity.

### Utilities

- **`indentation-formatter.ts`**

  - Manages indentation formatting.
  - Converts leading spaces/tabs into placeholder markers.

- **`inline-style-applier.ts`**

  - Ensures proper inline styling when copying to the clipboard.

- **`node-utils.ts`**

  - Processes DOM nodes.
  - Wraps standalone text nodes inside `<span>` elements.

- **`sanitizer.ts`**

  - Sanitizes input and output for proper formatting and security.

- **`utils.ts`**
  - Provides generic utility functions like retrieving object entries.

### Clipboard Copy Process

Copying highlighted code requires multiple steps for accuracy:

1. **Highlighting Code (`syntax-highlight.service.ts`)**

   - Loads Prism.js syntax definitions.
   - Applies syntax highlighting and generates HTML output.

2. **Formatting Indentation (`indentation-formatter.ts`)**

   - Replaces indentation characters (tabs, spaces) with placeholder markers for consistency.

3. **Applying Inline Styles (`inline-style-applier.ts`)**

   - Converts necessary styles into inline properties to retain formatting upon pasting.

4. **Processing Nodes (`node-utils.ts`)**

   - Ensures text nodes are wrapped inside `<span>` elements for structured styling.

5. **Clipboard Copy Execution**
   - Copies two versions to the clipboard:
     - `text/html`: Preserves syntax highlighting and formatting.
     - `text/plain`: Ensures clean, unformatted text for plaintext applications.
