(function (Prism) {
  /**
   * 1) Define a dedicated "vue" grammar by extending Prism's built-in "markup".
   *    This will allow us to highlight .vue Single File Components (SFCs) which
   *    include <template>, <script>, and <style> blocks.
   */
  Prism.languages.vue = Prism.languages.extend('markup', {});

  /**
   * 2) Common Vue directives and shorthand notations:
   *    - v-if, v-else-if, v-else, v-for, v-show, v-bind, v-on, v-model, etc.
   *    - ":" shorthand for v-bind
   *    - "@" shorthand for v-on
   */
  Prism.languages.insertBefore('vue', 'tag', {
    'vue-directive': {
      // Matches attributes like v-something, v-something:arg, v-something.modifier, etc.
      pattern: /\bv-(?:[\w-]+(?:\:[\w-]+)?(?:\.[\w-]+)*)\b/,
      alias: 'directive'
    },
    'vue-shorthand-bind': {
      // Matches :propName=... (equivalent to v-bind:propName)
      pattern: /\b:[\w-]+(?:\.[\w-]+)*\b/,
      alias: 'directive'
    },
    'vue-shorthand-on': {
      // Matches @eventName=... (equivalent to v-on:eventName)
      pattern: /\b@[\w-]+(?:\.[\w-]+)*\b/,
      alias: 'directive'
    }
  });

  /**
   * 3) Mustache interpolation: {{ expression }}
   *    We treat the content inside as JavaScript/TypeScript expression.
   */
  Prism.languages.insertBefore('vue', 'entity', {
    'vue-interpolation': {
      pattern: /\{\{[\s\S]*?\}\}/,
      greedy: true,
      inside: {
        'delimiter': {
          pattern: /^\{\{|\}\}$/,
          alias: 'punctuation'
        },
        'interpolation-content': {
          pattern: /[\s\S]+/,
          inside: Prism.languages.javascript // or 'typescript' if desired
        }
      }
    }
  });

  /**
   * 4) Highlight <style> blocks as CSS (or SCSS, etc. if needed).
   *    - We look for the content inside <style> ... </style>.
   *    - If you use <style lang="scss"> or similar, swap in the SCSS grammar.
   */
  Prism.languages.insertBefore('vue', 'script', {
    'vue-style': {
      pattern: /(<style[^>]*>)[\s\S]*?(?=<\/style>)/i,
      lookbehind: true,
      greedy: true,
      inside: Prism.languages.css
    },
    'vue-style-tag': {
      pattern: /<\/?style[^>]*>/i,
      alias: 'keyword'
    }
  });

  /**
   * 5) Highlight <script> blocks as JavaScript or TypeScript.
   *    - Looks for content inside <script> ... </script>.
   *    - If you use <script lang="ts"> or <script lang="tsx">, switch to 'typescript' grammar.
   */
  Prism.languages.insertBefore('vue', 'script', {
    'vue-script': {
      pattern: /(<script[^>]*>)[\s\S]*?(?=<\/script>)/i,
      lookbehind: true,
      greedy: true,
      // Use Prism.languages.typescript if you prefer <script lang="ts">
      inside: Prism.languages.javascript
    },
    'vue-script-tag': {
      pattern: /<\/?script[^>]*>/i,
      alias: 'keyword'
    }
  });

  /**
   * 6) Optionally handle nested <template> blocks inside a .vue file, e.g. for
   *    <template #someSlot> or <template v-if="...">. We highlight them recursively as Vue.
   */
  Prism.languages.insertBefore('vue', 'script', {
    'vue-nested-template': {
      pattern: /(<template[^>]*>)[\s\S]*?(?=<\/template>)/i,
      lookbehind: true,
      greedy: true,
      inside: Prism.languages.vue // highlight recursively
    },
    'vue-template-tag': {
      pattern: /<\/?template[^>]*>/i,
      alias: 'keyword'
    }
  });
})(Prism);
