:::div{style='display: none;'}
:define-var[Architectures <3 js]{#title}
:define-var[some witty subtitle]{#subtitle}
:define-var[]{#section}
:::

::::::::::::::::::shell

<header>

::::div{style = "display: flex; width: 100%; justify-content: space-between"}
::var{#title}
::var{#section}
::::

</header>

<footer>

<img class="adesso" src="./images/adesso-logo.svg" />

<div class="speaker">
  <img class="twitter" src="./images/twitter.svg" />
  <span>@KatjaPotensky</span>
</div>

</footer>

::::::::::::::::::::::::

:::slide{#greeting.no-shell}

# :var{#title}

### :var{#subtitle}

<!-- this is optional but useful for external events -->
<div class="info">
  <img class="conference" src="./images/javascriptdays.png" />
  <div class="speaker">
    <img class="twitter" src="./images/twitter.svg" />
    <h4>@KatjaPotensky</h4>
  </div>
</div>
<img class="adesso" src="./images/adesso.webp" />

:::

[//]: <> (PRESENTATION STARTS HERE)
[//]: <> (PRESENTATION STARTS HERE)
[//]: <> (PRESENTATION STARTS HERE)

:::slide{#agenda}

# Agenda

- prelude
  - naming conventions
  - fp intro
  - setup
- intro
- ports and adapters
- cqrs 
- event sourcing
- lazy loading
- architectural decision records

:::

[//]: <> (START: Prelude)

::::::::::::::::::::::::slide

::::slide{.no-shell.bg-black}

<div class="center">

# Naming conventions

</div>

::::

::::slide

# Namespaced imports

```typescript
import * as Rx from "rxjs";
```
```typescript
import * as Domain from "../domain";
```

:::fragment

# Exceptions

```typescript
import { task } from "fp-ts";
```
```typescript
import { pipe } from "fp-ts/lib/function";
```
```typescript
import { ignore } from "utils";
```

:::

::::

::::::::::::::::::::::::

::::::::::::::::::::::::slide

::::slide{.no-shell.bg-black}

<div class="center">

# FP - Intro

</div>

::::

::::slide

# Composition - pipe

```typescript
const getZero = () => 0;

const shoutOne = () => {
  const one = addOne(getZero());
  const stringified = stringify(one);
  const uppercased = uppercase(stringified);
  return uppercased;
}
```
:::fragment

is the same as this:

```typescript
const getZero = () => 0;

const shoutOne = pipe(
  getZero,
  addOne,
  stringify,
  uppercase
);
```

:::

::::

::::slide

# Composition - flow

```typescript
const shoutNext = (getNumber) => {
  const next = addOne(getNumber());
  const stringified = stringify(next);
  const uppercased = uppercase(stringified);
  return uppercased;
}
```

:::fragment

is the same as this:

```typescript
const shoutNext = flow(
  addOne,
  stringify,
  uppercase,
);
```

:::

::::

::::slide

# Functors

```typescript
const shoutNext = (fetchNumber) => fetchNumber()
  .then(addOne)
  .then(stringify)
  .then(uppercase);
```

:::fragment

is equivalent to this:

```typescript
const shoutNext = flow(
  task.map(addOne),
  task.map(stringify),
  task.map(uppercase),
);
```

:::

::::

::::slide

# Chains

```typescript
const shoutNext = (fetchNumber) => fetchNumber()
  // add one and return wrapped in promise
  .then((number) => Promise.resolve(addOne(number)))
  // stringify and return wrapped in promise
  .then((next) => pipe(stringify(next), Promise.resolve))
  // uppercase and return wrapped in promise
  .then(flow(uppercase, Promise.resolve));
```

:::fragment

is equivalent to this:

```typescript
const shoutNext = flow(
  // add one and return wrapped in task
  task.chain((number) => task.of(addOne(number))),
  // stringify and return wrapped in task
  task.chain((next) => pipe(stringify(next), task.of)),
  // uppercase and return wrapped in task
  task.chain(flow(uppercase, task.of)),
);
```

:::

::::

::::slide{.no-shell}

<div class="center">

# Wrap-Up

- go with the _flow_
- monads aren't hard
- fp isn't black magic

</div>

::::

::::slide{.bg-black}

<div class="center">

# Setup

1. `git submodule update --init`
1. `npm ci`
1. `npm start`
1. open `localhost:3000`
1. add a few todos

## About Tasks

run `npm ci` when starting a new task

</div>

::::

:::::::::::::::::::::::::::::

[//]: <> (END: Prelude)

[//]: <> (START: Actual Content)

::::slide{#intro.bg-black.no-shell}

<div class="center">

# What is "Architecture"?

</div>

:::speaker

- decisions that are hard to change
- programming with a plan
- defines structure

:::

::::

:::::::::::::::::::slide{section = "Ports and Adapters"}

::::slide{.no-shell.bg-black}

<div class="center text-center">

# Ports and Adapters / Hexagonal Architecture

</div>

::::

::::slide

# Theory

<img style="height: 75%; width: 100%; left: -25px;" class="relative" src="./images/hexagonal-theory.svg" />

::::

::::slide

# Example - Frontend

<img style="height: 75%; width: 100%;" class="relative" src="./images/hexagonal-frontend.svg" />

::::

::::slide

# Example - Backend

<img style="height: 75%; width: 100%;" class="relative" src="./images/hexagonal-backend.svg" />

::::

::::slide{.no-shell}

<div class="center">

# Wrap Up
- adapter connects to outside
- boundary translates outside to domain
- application orchestrates all the things
- domain models business and is _pure_

</div>

::::

:::::::::::::::::::

:::::::::::::::::::slide

::::slide{#task-01.bg-black}

<div class="center">

# Defining Dependencies

1. `cd task-01`
1. define dependencies via `eslint-plugin-import`
1. try to commit your changes

</div>

::::

::::slide{#task-02.bg-black}

<div class="center">

# A wild error appears

1. open `overview.tsx` (where the lint error occurs)
1. instead of using the api, use the store
1. use todos with 
  ```typescript
  const { todos } = Store.Todo.useTodos();
  ```

</div>

::::

:::::::::::::::::::

[//]: <> (PRESENTATION ENDS HERE)
[//]: <> (PRESENTATION ENDS HERE)
[//]: <> (PRESENTATION ENDS HERE)

:::slide{#qna.no-shell}

<img src="./images/qna-background.png" />
<h1>Questions & possible Answers</h1>

:::
