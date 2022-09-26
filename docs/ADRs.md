# 2022-09-13: message acknowledgement
## Context and Problem Statement
We need a way to prevent a **consumer** from consuming the same message multiple times.
## Considered Options
1. telling the **broker** which messages you acknowledge
2. saving the latest processed message ID somewhere in the domain of the **consumer**
3. write idempotent **consumer**s
## Decision Outcome
Chosen Option: 3, because delegating the responsibility to each consumer to handle duplicate events correctly splits the load evenly.
# 2022-09-13: partially successful message processing
## Context and Problem Statement
When multiple consumers receive a message it is possible that only a part of them succeed in processing the message while others may not. The event can thus not be acknowledged as "successfully processed".
## Considered Options
1. save which event was already processed in each consumer and skip duplicates
2. start a transaction at the root of the event handler and roll it back if at least one consumer fails to process the message successfully
## Decision Outcome
Chosen Option: 1, because:
- consumers must not rely on each other, so they can be considered independent
- fault detection within a consumers state will be easier that way
- the responsibility to partake in a transaction is up to the individual repositories, leading to difficult and error prone implementations
# 2022-09-14: adapter vs boundary
## Context and Problem Statement
Boundary could be defined as "technical boundary" where adapters are a part of the boundary layer.
## Considered Options
1. put adapters into the boundary layer
2. separate adapters
## Decision Outcome
Chosen Option: 2, because
- boundary is the driving part
- adapter is the driven part
i.e. boundary is ingress, adapters are egress
# 2022-09-26: test rendering
## Context and Problem Statement
When rendering tests via react testing library we rely on jest globals being present through the use of ambient imports. Those are not available in the browser, but would still be imported when using exports from the "test" namespace for demoize. Because of that demoized components can't use the "test" namespace.
## Considered Options
1. create a new "test-demoize" namespace
2. rewrite the ambient imports to dynamic imports since those wouldn't be called in the browser
3. exclude the problematic modules in the demoize build chain
4. don't export the jest related stuff from the root of the "test" namespace
## Decision Outcome
Chosen Option: 4, because importing from a submodule to render or demo a component is a smaller tradeoff than the other options.