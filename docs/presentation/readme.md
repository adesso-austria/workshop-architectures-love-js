# Setup

1. run `npm ci` to install all dependencies

# How to write a presentation with this template

1. open `presentation.md`
1. write your slides in markdown
  - [markdown directives](https://talk.commonmark.org/t/generic-directives-plugins-syntax/444/37) are supported
  - the `shell` container defines a template that is placed on each following slide
  - the `slide{id = greeting}` defines the first slide of your deck.
  - the `slide{id = qna}` defines the last slide of your deck
  - write your slides between `#greeting` and `#qna`

## Notes about customization

* list items that start with `*` will be treated as a fragment, so lists that you write with `-` and `+` appear immediately while those with `*` appear successively as you scroll through the slides

# Directives

## Notable directives

* `:::slide` - a _container_ directive, opens a new slide.
  ```markdown
  :::slide
  # Content of the slide
  :::
  ```
  - nested slides are allowed and create vertical transitions
* `:::fragment`, `::fragment`, `:fragment` - this directive is available as a _container_, _leaf_ or _text_ directive and enables you to fade in content on the slide incrementally
* `:::speaker` renders content that will show up on the notes section in the speaker view
* `::speaker` render content that is only visible in the speaker view and covers a whole block
* `:speaker` render content that is only visible in the speaker view and will show up in-line with the text where it's placed


#### for a full list check `src/components.ts`

## Custom directives

You can write any well-known html tag as `:<tag>[<content>]{<attributes>}`, so for example `:span[Test]{ style = "color: tomato; font-size: 5em"}` would render a `span` element with content `Test` and style it accordingly.

If you think your custom directive should be available to everyone please open a PR and extend the `src/components.ts` module.

# Code highlighting

You can highlight code by placing the ranges to be highlighted in the meta part of a code directive.

E.g. to highlight line `1` and `2` first and then (in the next fragment) only line `1` from column `7` through `12` you can write

<pre>
```typescript 1,2|1:7-1:12
const x = 0;
const y = x + 5;
```
</pre>

# Mermaid charts

Mermaid should have full support, just wrap your definition in a `mermaid` directive.

#### Example

```markdown
:::mermaid
flowchart LR
  start["use powerpoint"]
  question{"Are you okay"}
  yes["Yes"]
  no["No"]
  start-->question
  question-->yes
  question-->no
</pre>
:::
```

# Showing the presentation

1. run `npm start`
1. open the browser at `localhost:8080`

# Export to pdf

1. open the browser at `localhost:8080?print-pdf`
1. print the side with no margins and in landscape mode
