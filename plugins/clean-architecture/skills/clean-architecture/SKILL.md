---
name: clean-architecture
description: Review code and provide design guidance based on Clean Architecture principles. Checks dependency rule, layer separation, crossing boundaries, and SOLID principles. Use when asked to review architecture, check dependencies, or design with clean architecture principles.
---

# Clean Architecture Review Skill

## Overview

This skill analyzes and reviews code based on Robert C. Martin's (Uncle Bob) Clean Architecture principles.

## When to Use

- When user requests "clean architecture" review
- When asked about "architecture review", "dependency check", or "layer separation"
- When designing new features with clean architecture
- When splitting a feature into domain, data, presentation, and dependency-injection modules, or replacing a fake with a real backend

## Instructions

### 1. Project Structure Analysis

First, understand the project's directory structure:
- Check if layers are separated
- Examine module/package structure
- Identify dependency direction
- Find an existing feature that already follows the project's layering and reuse its conventions (file names, port shape, how implementations are injected) instead of inventing a new style

When designing rather than reviewing, decide these before writing code:
1. Which rules does this application own, and which are decided by an external authority (server, payment provider, ad network)?
2. Which ports does the inner layer need, and which operations belong on each one?
3. Where is the composition root that chooses implementations?
4. Which fake or mock adapters are needed now, and what will replace them later?

### 2. The Dependency Rule

**Core Principle**: Source code dependencies must only point inward (toward higher-level policies).

```
┌─────────────────────────────────────────────────────────┐
│                  Frameworks & Drivers                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Interface Adapters                  │    │
│  │  ┌─────────────────────────────────────────┐    │    │
│  │  │              Use Cases                   │    │    │
│  │  │  ┌─────────────────────────────────┐    │    │    │
│  │  │  │           Entities              │    │    │    │
│  │  │  └─────────────────────────────────┘    │    │    │
│  │  └─────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                    ← Dependencies flow inward
```

Checklist:
- Do inner layers avoid referencing outer layers?
- Are Entities unaware of Use Cases, Adapters, and Infrastructure?
- Do Use Cases avoid directly referencing Adapters or Infrastructure?
- Is DIP applied when crossing boundaries?
- Do presenters, view models, controllers, and UI components avoid importing the composition root or DI container?

### 2-0. The Composition Root Is the Outermost Layer

The module that chooses concrete implementations (DI container, service locator, `provide*` factory, app entry point) depends on everything, so nothing inside may depend on it.

- Wire implementations in one place at the edge (application entry, root component, `main`) and pass them inward through constructors, parameters, or a context/provider
- An inner module that calls the DI module to fetch its own dependencies has hidden a concrete dependency behind a function call; this violates the dependency rule even though no concrete class is imported
- Swapping a fake for a real implementation must change only the composition root

```typescript
// Bad: the view model reaches out to the container
class InventoryViewModel {
  private repository = AppContainer.inventoryRepository();
}

// Good: the composition root decides and injects
class InventoryViewModel {
  constructor(private repository: InventoryRepository) {}
}

const viewModel = new InventoryViewModel(createInventoryRepository(config));
```

### 2-1. Crossing Boundaries

The flow of control and source code dependency can point in opposite directions.

```
Controller → Use Case → Presenter
     ↓           ↓           ↑
[dependency] [dependency] [inverted!]
```

Example: When Use Case needs to call Presenter
- Directly referencing Presenter from Use Case violates the dependency rule
- **Solution**: Define Output Port (interface) inside Use Case, Presenter implements it

```typescript
// Use Case Layer (inner)
interface OrderOutputPort {
  presentOrder(order: OrderData): void;
}

class CreateOrderUseCase {
  constructor(private outputPort: OrderOutputPort) {}
  execute() {
    // ... business logic
    this.outputPort.presentOrder(orderData);
  }
}

// Adapter Layer (outer) - depends on Use Case
class OrderPresenter implements OrderOutputPort {
  presentOrder(order: OrderData): void {
    // Transform for UI
  }
}
```

### 2-2. What Data Crosses Boundaries

**Principle**: Data crossing boundaries should be simple data structures (DTOs).

```typescript
// Bad: Passing Entity directly
class GetUserUseCase {
  constructor(private userRepository: UserRepository) {}
  execute(id: string): Promise<User> { // Returning Entity directly
    return this.userRepository.findById(id);
  }
}
```

```typescript
// Good: Transform to DTO
class GetUserUseCase {
  constructor(private userRepository: UserRepository) {}
  async execute(id: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(id);
    return { id: user.id, name: user.name };
  }
}
```

Checklist:
- Are Entities or Database Rows not crossing boundaries directly?
- Are external framework data formats not penetrating inner layers?
- Do boundary data structures serve the inner layer without adding redundant DTOs for every layer?

### 3. Layer Structure Review

#### Entities (Domain Layer)
- Contains core business rules
- Independent of outer-layer frameworks, persistence, and UI
- Least likely to change

Checklist:
- Does Entity avoid depending on frameworks?
- Does it contain only pure business logic?
- Do imported libraries preserve domain independence rather than introduce infrastructure concerns?
- Does the domain avoid re-implementing rules owned by an external authority? (see 3-1)
- Does it avoid presentation-only rules such as display thresholds, copy, colors, or formatting?

#### 3-1. Who Owns the Policy?

When an external authority decides a rule (quotas, eligibility, pricing, reward amounts, expiry), the client must not duplicate that rule in its domain. Duplicated rules drift: the authority changes the rule and the client shows stale numbers until the next release.

- Let the port return the decision itself (`remainingToday`, `nextGrantAmount`, `expiresAt`) instead of the raw inputs the client would need to compute it
- Keep only rules the application truly owns in the domain
- While the authority does not exist yet, put the simulated policy inside the fake adapter that stands in for it, not in the domain

#### 3-2. Presentation Rules Stay in the Presentation Layer

A pure function is not automatically a domain rule. "Show a warning when an item expires within 3 days" is a display decision; changing 3 to 2 alters no business outcome. Keep such thresholds, labels, and countdown formatting in presenters or view models, and promote them to the domain only when a business process (for example a notification job) needs the same rule.

#### Use Cases (Application Layer)
- Application-specific business rules
- Orchestrates Entities to implement features
- Defines interfaces for external systems

Checklist:
- Does each Use Case have a single responsibility?
- Are Input/Output ports clearly defined?
- Does it use Repository interfaces (not implementations)?

#### Interface Adapters
- Handles data transformation
- Contains Controllers, Presenters, Gateways
- Can apply patterns like MVC, MVVM

Checklist:
- Is transformation between DTOs and Entities happening here?
- Is the separation between external and internal formats clear?
- Are UI components thin, with state transitions, locking, cancellation, and copy selection moved into presenters, controllers, or view models that can be read without the UI?

#### Frameworks & Drivers (Infrastructure Layer)
- DB, Web Framework, external services
- Mostly glue code
- Most likely to change

Checklist:
- Are framework and database details kept out of Entities and Use Cases?
- Do Repository implementations depend inward on ports, whether placed in Adapters or Infrastructure?
- Do persistence or wire formats (serializers, schema-generated types) stay separate from Entities, with explicit mapping in the adapter?

#### 3-3. Fakes and Mocks Are Adapters

A fake backend, in-memory store, or mock SDK is an outer-layer implementation of the same port.

- Place it next to the real adapters, never inside the domain or UI
- Select it only in the composition root, so the real implementation replaces it without touching inner code
- Give it the same contract as the real one, including idempotency and failure results, so callers do not change when it is swapped

#### 3-4. Keep Debug Operations Off Production Ports

Reset, seed, and time-travel operations used only in development or staging do not belong on the production port; otherwise every real implementation must implement them (ISP). Expose them as a separate optional capability that the composition root provides only in those environments.

### 4. SOLID Principles Review

Object-oriented design principles used in Clean Architecture implementation. **DIP** is essential for Crossing Boundaries.

| Principle | Description | Clean Architecture Relevance |
|-----------|-------------|------------------------------|
| **SRP** | A class should have only one reason to change | Layer responsibility separation |
| **OCP** | Open for extension, closed for modification | Extension through interfaces |
| **LSP** | Subtypes must be substitutable for base types | Implementation replaceability |
| **ISP** | Don't depend on interfaces you don't use | Port interface segregation |
| **DIP** | Depend on abstractions, not concretions | **Core of Crossing Boundaries** |

### 5. Verify Mechanically

Do not rely on folder names. List what each layer actually imports with the project's search tools, for example:

```bash
# Inner layers must not mention outer modules or the composition root
rg -n "Container|Module\.provide|Repository(Impl)?\b" src/domain
rg -n "AppContainer|Module\.provide" src/presentation src/ui
# Fakes must be referenced only by the composition root
rg -n "Fake|Mock" src --glob '!src/data/**' --glob '!src/di/**'
```

Report each violation with the file and line, the inner module, the outer module it reaches, and the boundary that fixes it.

## Output Format

Provide review results in this format:

```markdown
# Clean Architecture Review Report

## Summary
- Overall Assessment: [Good/Needs Improvement/Critical]
- Key findings summary

## Dependency Rule Analysis
- List of violations
- Improvement suggestions

## Layer Structure Review
### Entities: [Good/Needs Improvement]
### Use Cases: [Good/Needs Improvement]
### Interface Adapters: [Good/Needs Improvement]
### Infrastructure: [Good/Needs Improvement]

## Recommendations
1. High priority improvements
2. Medium priority improvements
3. Long-term suggestions
```

## Important Notes

### Clean Architecture is Not a Silver Bullet

- Not all projects require exactly 4 layers
- Layer count is flexible as long as the dependency rule is followed
- Apply according to project scale and complexity

### Common Pitfalls to Avoid

1. **Over-obsession with layers**: Layer separation is not the goal itself
2. **Over-abstraction**: Adding interfaces without a useful boundary; one implementation is enough when a port isolates business rules from infrastructure
3. **Superficial adoption**: Relying on IDE refactoring while ignoring actual dependency rules
4. **Over-engineering for the future**: Adding complexity for unlikely changes

### Key Questions

Always consider these questions during review:
- "Does this separation actually provide benefits?"
- "Is the dependency rule truly being followed?"
- "Is the impact scope minimized when changes occur?"

### Practical Verification

Ask yourself if you're really benefiting from Clean Architecture:
- Is it the layer separation that helps, or just IDE auto-refactoring?
- Does this Repository interface isolate business rules from infrastructure, regardless of implementation count?
- Are you over-abstracting for a 0.001% chance of future change?
- Can you rename a class in outer modules without affecting inner modules?

## Language-Specific Examples

### TypeScript/JavaScript
```typescript
// Good: Dependency Inversion
interface UserRepository {
  findById(id: string): Promise<User>;
}

class GetUserUseCase {
  constructor(private userRepository: UserRepository) {}
}

// Bad: Depending on concrete implementation
class GetUserUseCase {
  constructor(private userRepository: PostgresUserRepository) {}
}
```

### Functional languages (OCaml, ReScript, F#, Elm-style records)

A port does not need classes. A record of functions is a port, and the composition root builds it.

```ocaml
(* Domain: port as a record of functions *)
type inventory_repository = {
  load : unit -> inventory Lwt.t;
  reserve : request_id:string -> (reservation, failure) result Lwt.t;
}

(* Data: one adapter per backend, each returning the same record *)
let fake_inventory ~store = { load = ...; reserve = ... }
let http_inventory ~client = { load = ...; reserve = ... }

(* Composition root: the only place that chooses *)
let inventory = if config.use_fake then fake_inventory ~store else http_inventory ~client
```

### Python
```python
# Good: Interface definition using Protocol
from typing import Protocol

class UserRepository(Protocol):
    def find_by_id(self, id: str) -> User: ...

# Bad: Direct implementation import
from infrastructure.postgres import PostgresUserRepository
```

### Java/Kotlin
```kotlin
// Good: Interface segregation
interface UserRepository {
    fun findById(id: String): User?
}

class GetUserUseCase(
    private val userRepository: UserRepository
)

// Bad: Using concrete implementation
class GetUserUseCase(
    private val userRepository: JpaUserRepository
)
```

## References

- [The Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- Clean Architecture: A Craftsman's Guide to Software Structure and Design (Book)
