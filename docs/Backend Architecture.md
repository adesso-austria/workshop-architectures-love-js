```mermaid
flowchart
Application-->Domain & Repository
Boundary-->Domain & Contracts & Application
Repository-->Domain & Adapter
```
# Domain
- models of objects that are unique to the backend domain
- pure functions around those models
# Boundary
- mapping from contracts to domain models
- http endpoints
# Application
- glue code/orchestration of repositories, consumers
# Repository
- handling of persistence with concrete purpose in regard to domain
# Adapter
- low level handling of external systems, suchs as dbs
# CQRS
```mermaid
flowchart LR
subgraph client
	command["Command"]
	query["Query"]
end
subgraph server
	subgraph write model
		broker[("Broker")]
	end
	consumer["Consumer"]
	knows{"Knows event?"}
	yes-->doNothing(("do nothing"))
	no
	subgraph read model
		state[("State")]
	end
end

command--is sent to-->broker--publishes event-->consumer
consumer-->knows-->yes & no
no--updates-->state
state--answers-->query
```