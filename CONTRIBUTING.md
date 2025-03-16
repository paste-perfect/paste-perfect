# Contributing & Local Installation

## Contributing

Contributions are more than welcome! To get started:

1. **Fork** this repository and create a new **branch** for your feature or bug fix.
2. **Commit** your changes with clear and concise commit messages.
3. Ensure that the code adheres to the project's style guidelines:
   ```bash
   npm run lint
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

  1. **`highlightCode(code: string, language: LanguageDefinition)`**
    - Loads the right Prism.js file if necessary.
    - Applies syntax highlighting and returns the resulting HTML.

  2. **`copyToClipboard()`**
    - Wraps every text node in `<span>` elements so inline styles can be accurately transferred.
    - Converts leading spaces/tabs into placeholder markers, ensuring consistent indentation after copying.
    - Applies minimal inline CSS by reading and setting only the essential style properties needed (e.g., color, font size).
    - Replaces the placeholder markers with the desired indentation characters (tabs, multiple spaces, or non-breaking spaces).
    - Copies two versions to the clipboard—an `text/html` snippet (with inline styling) and a simpler `text/plain` version—making sure the syntax colors and indentation remain intact in various editors (Word, PowerPoint, etc.).


