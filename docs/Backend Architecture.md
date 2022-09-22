```mermaid
flowchart
Application-->Domain & Repository
Boundary-->Domain & Contracts & Application
Repository-->Domain & Adapter
```
# Boundary
- mapping from contracts to domain models
- http endpoints
# Application
- glue code/orchestration of repositories
# Adapters
- low level handling of external systems
# Fetching a todo
```mermaid
sequenceDiagram
Actor user
user->>server: request todo with id X

activate server

server->>repository: retrieve todo with id X

activate repository
	repository->>redis: retrieve events since last known
	redis->>repository: send events since last known
	repository->>mongo: apply missing events
	repository->>mongo: retrieve todo with id X
	mongo->>repository: return todo | undefined
	repository->>server: return retrieved todo
deactivate repository

server->>user: send retrieved todo

deactivate server
```

