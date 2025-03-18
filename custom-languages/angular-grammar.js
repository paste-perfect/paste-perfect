(function (Prism) {
  // 1) Extend the built-in TypeScript grammar.
  Prism.languages.angular = Prism.languages.extend('typescript', {});

  // 2) Angular Decorators (e.g. @Component(...), etc.).
  Prism.languages.insertBefore('angular', 'class-name', {
    'angular-decorator': {
      pattern: /@(Component|Directive|Pipe|Injectable|NgModule)\s*\(\s*\{[^}]+\}\s*\)/,
      inside: {
        'at': {
          pattern: /^@(Component|Directive|Pipe|Injectable|NgModule)/,
          alias: 'keyword'
        },
        'object': {
          pattern: /\{[^}]+\}/,
          inside: Prism.languages.json
        }
      }
    }
  });

  // 3) Angular-specific tokens (signals, common keywords, etc.).
  Prism.languages.insertBefore('angular', 'keyword', {
    'angular-signals': {
      // e.g. signal, computed, effect, etc.
      pattern: /\b(?:signal|computed|effect|useEffect|inject|destroyRef)\b/,
      alias: 'function'
    },
    'angular-input-output': {
      // e.g. @Input, @Output, etc.
      pattern: /@(?:Input|Output|SignalInput|SignalOutput|HostBinding|HostListener)\b/,
      alias: 'function'
    },
    'angular-keywords': {
      // Common Angular classes & keywords up to v19
      pattern:
        /\b(?:Injectable|Inject|EventEmitter|NgModule|ViewChild|ViewChildren|ContentChild|ContentChildren|HostListener|HostBinding|ChangeDetectionStrategy|ViewEncapsulation|DestroyRef|ComponentRef|EnvironmentInjector|createEnvironmentInjector|importProvidersFrom)\b/,
      alias: 'keyword'
    }
  });

  /**
   * 4) Shared tokens for Angular-in-HTML (both inline in .ts and in .html).
   *    - Structural directives, events, property bindings, etc.
   *    - Also <style> and <template> handling.
   */
  var angularHtmlTokens = {
    // Example: *ngIf, *ngFor, etc. We keep the old stars, but remove the new @if|@for etc. from here.
    'angular-structural-directive': {
      pattern: /\*(?:ngIf|ngFor|ngSwitch|ngSwitchCase|ngSwitchDefault|ngTemplateOutlet)/,
      alias: 'directive'
    },
    // Common (non-structural) directives like [ngModel], etc.
    'angular-directive': {
      pattern: /\b(?:ngIf|ngFor|ngClass|ngStyle|ngSwitch|ngModel|ngTemplateOutlet|ngContent)\b/,
      alias: 'directive'
    },
    // (event)="expression"
    'angular-event': {
      pattern: /\(\s*[^)]+\s*\)=\s*(["'`])[^"'`]+\1/,
      inside: {
        'event-name': {
          pattern: /\(\s*[^)]+\s*\)/,
          alias: 'attr-name'
        },
        'event-binding': {
          pattern: /=\s*(["'`])[^"'`]+\1/,
          inside: Prism.languages.javascript
        }
      }
    },
    // [property]="expression"
    'angular-property-binding': {
      pattern: /\[\s*[^\]]+\s*\]=\s*(["'`])[^"'`]+\1/,
      inside: {
        'property-name': {
          pattern: /\[\s*[^\]]+\s*\]/,
          alias: 'attr-name'
        },
        'property-binding': {
          pattern: /=\s*(["'`])[^"'`]+\1/,
          inside: Prism.languages.javascript
        }
      }
    },
    // [style.someProp]="expression"
    'angular-style-binding': {
      pattern: /\[style\.[a-zA-Z-]+\]=\s*(["'`])[^"'`]+\1/,
      inside: {
        'style-name': {
          pattern: /\[style\.[a-zA-Z-]+\]/,
          alias: 'attr-name'
        },
        'style-binding': {
          pattern: /=\s*(["'`])[^"'`]+\1/,
          inside: Prism.languages.javascript
        }
      }
    },
    // <style> ... </style> => highlight as CSS
    'angular-css': {
      pattern: /(<style[^>]*>)[\s\S]*?(?=<\/style>)/i,
      lookbehind: true,
      greedy: true,
      inside: Prism.languages.css
    },
    'angular-css-tag': {
      pattern: /<\/?style[^>]*>/i,
      alias: 'keyword'
    },
    // <template> ... </template> => highlight as Angular HTML (recursive)
    'angular-template': {
      pattern: /(<template[^>]*>)[\s\S]*?(?=<\/template>)/i,
      lookbehind: true,
      greedy: true,
      inside: {} // we set this to "angularHtml" later to avoid circular references
    },
    'angular-template-tag': {
      pattern: /<\/?template[^>]*>/i,
      alias: 'keyword'
    }
  };

  /**
   * 5) Define a dedicated "angularHtml" grammar for .html files or <template> blocks.
   *    - Start by extending normal markup
   */
  Prism.languages.angularHtml = Prism.languages.extend('markup', {});

  // Insert Angular tokens & new block syntax *before* <tag>, so it picks up first.
  Prism.languages.insertBefore('angularHtml', 'tag', {
    // Our existing structural directives, etc.
    'angular-structural-directive': angularHtmlTokens['angular-structural-directive'],
    'angular-directive': angularHtmlTokens['angular-directive'],
    'angular-event': angularHtmlTokens['angular-event'],
    'angular-property-binding': angularHtmlTokens['angular-property-binding'],
    'angular-style-binding': angularHtmlTokens['angular-style-binding'],

    // NEW: Control-flow blocks like @if (...) { ... }, @for (...) { ... }, etc.
    // This is a simplistic pattern that grabs the whole block including braces.
    // It won't perfectly handle nested braces, but covers most real-world usage.
    'angular-flow-block': {
      // Matches:
      //   @if (...) { ... }
      //   } @else if (...) { ... }
      //   } @else { ... }
      //   @for (...) { ... } @empty { ... }
      //   @switch (...) { ... } @case (...) { ... } @default { ... }
      pattern: /@(?:if|else\s+if|else|for|empty|switch|case|default)\b[\s\S]*?\{[\s\S]*?\}/,
      greedy: true,
      inside: {
        'block-keyword': {
          pattern: /^@(?:if|else\s+if|else|for|empty|switch|case|default)\b/,
          alias: 'keyword'
        },
        // If there's a (...) after the keyword, highlight within it as JS.
        'condition': {
          pattern: /\([^)]*\)/,
          inside: Prism.languages.javascript
        },
        // The braces content: highlight recursively as Angular HTML
        'inner-block': {
          pattern: /\{[\s\S]*\}$/,
          inside: {
            'punctuation': /^{|}$/,
            'rest': Prism.languages.angularHtml
          }
        }
      }
    }
  });

  // Handle <style> / <template> inside Angular HTML
  Prism.languages.insertBefore('angularHtml', 'script', {
    'angular-css': angularHtmlTokens['angular-css'],
    'angular-css-tag': angularHtmlTokens['angular-css-tag'],
    'angular-template': angularHtmlTokens['angular-template'],
    'angular-template-tag': angularHtmlTokens['angular-template-tag']
  });

  // Make the <template> token in "angularHtml" recurse back into "angularHtml"
  angularHtmlTokens['angular-template'].inside = Prism.languages.angularHtml;

  /**
   * 6) Inline Angular HTML in .ts code: e.g. template: `...` or styles: [`...`].
   *    We'll insert the shared HTML tokens + special inline rules into "angular".
   */
  Prism.languages.insertBefore('angular', 'function', angularHtmlTokens);

  // Also handle <style> / <template> inside .ts as well
  Prism.languages.insertBefore('angular', 'script', {
    'angular-css': angularHtmlTokens['angular-css'],
    'angular-css-tag': angularHtmlTokens['angular-css-tag'],
    'angular-template': angularHtmlTokens['angular-template'],
    'angular-template-tag': angularHtmlTokens['angular-template-tag']
  });

  // 7) Inline templates in .ts: template: `...`
  Prism.languages.insertBefore('angular', 'string', {
    'angular-inline-template': {
      pattern: /\btemplate\s*:\s*(["'`])[\s\S]*?\1/,
      greedy: true,
      inside: {
        // the outer quotes
        'delimiter': {
          pattern: /^["'`]|["'`]$/,
          alias: 'string'
        },
        // {{ interpolation }}
        'interpolation': {
          pattern: /\{\{[\s\S]*?\}\}/,
          inside: {
            'interpolation-delimiter': {
              pattern: /^\{\{|\}\}$/,
              alias: 'punctuation'
            },
            'interpolation-content': {
              pattern: /[\s\S]+/,
              inside: Prism.languages.javascript
            }
          }
        },
        // The rest is Angular HTML
        'rest': Prism.languages.angularHtml
      }
    },

    // 8) Inline CSS arrays: styles: [`...`, `...`]
    'angular-inline-styles': {
      pattern:
        /\bstyles\s*:\s*(?:\[\s*(?:(["'`])[\s\S]*?\1\s*(?:,\s*(["'`])[\s\S]*?\2)*)?\s*\]|(["'`])[\s\S]*?\3)/,
      greedy: true,
      inside: {
        'punctuation': /\[|\],?/,
        'style': {
          // each quoted string is CSS
          pattern: /(["'`])[\s\S]*?\1/,
          greedy: true,
          inside: {
            'delimiter': {
              pattern: /^["'`]|["'`]$/,
              alias: 'string'
            },
            'rest': Prism.languages.css
          }
        }
      }
    }
  });
})(Prism);
