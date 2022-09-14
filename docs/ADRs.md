# 2022-09-13: message acknowledgement
## Context and Problem Statement
We need a way to prevent a **consumer** from consuming the same message multiple times.
## Considered Options
- telling the **broker** which messages you acknowledge
- saving the latest processed message ID somewhere in the domain of the **consumer**
- write idempotent **consumer**s
## Decision Outcome
Chosen Option: write idempotent consumers. Delegating the responsibility to each consumer to handle duplicate events correctly splits the load evenly.
# 2022-09-13: partially successful message processing
## Context and Problem Statement
When multiple consumers receive a message it is possible that only a part of them succeed in processing the message while others may not. The event can thus not be acknowledged as "successfully processed".
## Considered Options
- save which event was already processed in each consumer and skip duplicates
- start a transaction at the root of the event handler and roll it back if at least one consumer fails to process the message successfully
## Decision Outcome
Chosen Option: save which event was already processed in each consumer because:
- consumers must not rely on each other, so they can be considered independent
- fault detection within a consumers state will be easier that way
- the responsibility to partake in a transaction is up to the individual repositories, leading to difficult and error prone implementations
# 2022-09-14: adapter vs boundary
## Context and Problem Statement
Boundary could be defined as "technical boundary" where adapters are a part of the boundary layer.
## Considered Options
- put adapters into the boundary layer
- separate adapters
## Decision Outcome
Chosen Option: separate adapters, because
- boundary is the driving part
- adapter is the driven part
i.e. boundary is ingress, adapters are egress