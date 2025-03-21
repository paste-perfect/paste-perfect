# Paste Perfect

> Easily highlight and copy your code with HTML formatting for seamless pasting into Word, PowerPoint, or plain text. Enjoy clean, professional-looking code in just a few clicks!

[![Build Status](https://img.shields.io/github/actions/workflow/status/NikAcc/paste-perfect/build.yml?logo=github&label=Build-CI)](https://github.com/NikAcc/paste-perfect/actions/workflows/build.yml)
[![Deploy Status](https://img.shields.io/github/actions/workflow/status/NikAcc/paste-perfect/deploy.yml?logo=github&label=Deploy-CI)](https://github.com/NikAcc/paste-perfect/actions/workflows/deploy.yml)
[![GitHub Stars](https://img.shields.io/github/stars/NikAcc/paste-perfect?logo=github)](https://github.com/NikAcc/paste-perfect/stargazers)

[![Issues](https://img.shields.io/github/issues/NikAcc/paste-perfect?label=Open%20Issues)](https://github.com/NikAcc/paste-perfect/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Visit Paste Perfect

Check out the [**Paste Perfect Website**](https://nikacc.github.io/paste-perfect/) to start with the formatting

Here’s a quick look at Paste Perfect in action:
![Paste Perfect Screenshot](samples/sample-highlightings.gif)

## Table of Contents

* [Table of Contents](#table-of-contents)
* [Features](#features)
* [Usage](#usage)
* [Project Background](#project-background)
* [Contributing, Local Installation & Technical Details](#contributing-local-installation--technical-details)
* [License](#license)

## Features

* **Seamless Copy** – Retain syntax highlighting and indentation when copying to Word or PowerPoint.
* **Persistence** – Settings (language, theme, indentation, etc.) are remembered between sessions.
* **Dynamic Loading** – Only load the Prism.js language definitions you actually need.
* **Support for Different Indentation Modes** – Choose spaces, tabs, or non-breaking spaces (NBSP), depending on your target application.

## Usage

1. **Enter Your Code** → Paste or type your code in the **Source Code** section.
2. **Adjust Settings** → Select:
   * **Language** (e.g., TypeScript, Python, C++)
   * **Theme** (various color schemes)
   * **Indentation Mode**:
     * **Spaces/Tabs** → Best for Word
     * **NBSP** → Best for PowerPoint
   * **Indentation Size**
3. **View the Highlighted Output** → The formatted code appears in the **Result** section.
4. **Copy with Formatting** → Click the green **Copy** button to copy your code with inline styling.
5. **Auto-Save Preferences** → Settings persist, so you don’t need to reconfigure them next time.

## Project Background

I had the experience that most online syntax highlighters lose their formatting or indentation when pasted into Microsoft Word or PowerPoint. Either:

* **No styling** is preserved,
* **Indentation** is completely lost, or
* Other formatting issues occur.

**Paste Perfect** solves this by:

* **Inlining styles** before copying.
* **Replacing leading spaces/tabs with appropriate characters** to ensure indentation stays intact.
* **Allowing customization for different applications** (Word, PowerPoint, etc.).

## Contributing, Local Installation & technical details

See our [Contributing Guidelines](CONTRIBUTING.md). We appreciate your help in making Paste Perfect better!

## License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute this software as your needs require.
