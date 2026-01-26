# Clean Architecture Skills for Claude Code

A collection of Claude Code skills for code review and design guidance based on Clean Architecture principles and Kent Beck's refactoring philosophy.

## Skills

### Clean Architecture
Reviews code based on Robert C. Martin's Clean Architecture principles.

- **Dependency Rule Check**: Verify source code dependencies point inward (toward higher-level policies)
- **Layer Structure Analysis**: Review Entities, Use Cases, Interface Adapters, Infrastructure layers
- **Crossing Boundaries**: Guide on how to cross layer boundaries using DIP
- **SOLID Principles Review**: Check adherence to object-oriented design principles

### Kent Beck Style
Reviews code following Kent Beck's refactoring philosophy and simple design principles.

- **Code Smells Detection**: Identify Bloaters, OO Abusers, Change Preventers, Dispensables, Couplers
- **Refactoring Techniques**: Extract Method, Move Method, Replace Magic Number, etc.
- **Simple Design Principles**: YAGNI, KISS, 4 Rules of Simple Design
- **Intention-Revealing Code**: Naming guidelines, self-documenting code, constant extraction

## Installation

### Claude Code (Recommended)

```bash
# 1. Add marketplace
/plugin marketplace add nathankim0/clean-architecture-skills

# 2. Install skill
/plugin install clean-architecture@clean-architecture-skills
```

### Manual Installation

```bash
git clone https://github.com/nathankim0/clean-architecture-skills.git .claude-plugins/clean-architecture-skills
```

### Other AI Assistants

| Assistant | Installation |
|-----------|--------------|
| **Cursor** | Clone to `.cursor/skills/` directory |
| **Gemini CLI** | Clone to `~/.gemini/skills/` directory |
| **OpenCode** | Clone to `~/.opencode/skills/` directory |

## Repository Structure

```
clean-architecture-skills/
├── .claude-plugin/
│   └── marketplace.json          # Marketplace config
├── plugins/
│   ├── clean-architecture/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json       # Plugin metadata
│   │   └── skills/
│   │       └── clean-architecture/
│   │           └── SKILL.md      # Skill definition
│   └── kent-beck-style/
│       ├── .claude-plugin/
│       │   └── plugin.json       # Plugin metadata
│       └── skills/
│           └── kent-beck-style/
│               └── SKILL.md      # Skill definition
├── README.md
└── LICENSE
```

## Usage

### Clean Architecture

```bash
# Review entire project architecture
Review this project with clean architecture principles

# Review specific module
Check dependencies in src/domain directory

# Design new feature
Design user authentication with clean architecture
```

### Kent Beck Style

```bash
# Review code for code smells
Review this code for code smells and suggest refactorings

# Refactoring guidance
Help me refactor this long method

# Simple design review
Check if this code follows YAGNI and KISS principles

# Naming and readability
Improve the naming in this module
```

## Clean Architecture Overview

### The Dependency Rule

The most important principle of Clean Architecture:

> Source code dependencies must only point inward (toward higher-level policies).

```
┌─────────────────────────────────────────────────────────┐
│                  Frameworks & Drivers                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Interface Adapters                  │    │
│  │  ┌─────────────────────────────────────────┐    │    │
│  │  │              Use Cases                   │    │    │
│  │  │  ┌─────────────────────────────────┐    │    │    │
│  │  │  │           Entities              │    │    │    │
│  │  │  │      (Enterprise Business)      │    │    │    │
│  │  │  └─────────────────────────────────┘    │    │    │
│  │  └─────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                    ← Dependencies flow inward
```

### Layer Responsibilities

| Layer | Responsibility | Examples |
|-------|----------------|----------|
| **Entities** | Core business rules | User, Order, Product |
| **Use Cases** | Application business rules | CreateOrder, GetUserProfile |
| **Interface Adapters** | Data transformation | Controller, Presenter, Repository Interface |
| **Frameworks & Drivers** | External tools/frameworks | Express, PostgreSQL, React |

### SOLID Principles

| Principle | Description |
|-----------|-------------|
| **SRP** (Single Responsibility) | A class should have only one reason to change |
| **OCP** (Open/Closed) | Open for extension, closed for modification |
| **LSP** (Liskov Substitution) | Subtypes must be substitutable for base types |
| **ISP** (Interface Segregation) | Don't depend on interfaces you don't use |
| **DIP** (Dependency Inversion) | Depend on abstractions, not concretions |

## Example Project Structure

```
src/
├── domain/                 # Entities Layer
│   ├── entities/
│   │   ├── User.ts
│   │   └── Order.ts
│   └── value-objects/
│       └── Email.ts
│
├── application/            # Use Cases Layer
│   ├── use-cases/
│   │   ├── CreateOrderUseCase.ts
│   │   └── GetUserUseCase.ts
│   └── ports/
│       ├── input/
│       │   └── CreateOrderInput.ts
│       └── output/
│           └── UserRepository.ts
│
├── adapters/               # Interface Adapters Layer
│   ├── controllers/
│   │   └── OrderController.ts
│   ├── presenters/
│   │   └── UserPresenter.ts
│   └── gateways/
│       └── UserRepositoryImpl.ts
│
└── infrastructure/         # Frameworks & Drivers Layer
    ├── database/
    │   └── PostgresConnection.ts
    ├── web/
    │   └── ExpressServer.ts
    └── external/
        └── PaymentGateway.ts
```

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - Free to use, modify, and distribute.

## References

### Clean Architecture
- [The Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Clean Architecture: A Craftsman's Guide to Software Structure and Design](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164)

### Kent Beck Style
- [Refactoring: Improving the Design of Existing Code - Martin Fowler (with Kent Beck)](https://refactoring.com/)
- [Implementation Patterns - Kent Beck](https://www.amazon.com/Implementation-Patterns-Kent-Beck/dp/0321413091)
- [Refactoring Catalog](https://refactoring.com/catalog/)
- [Code Smells](https://refactoring.guru/refactoring/smells)

### General
- [Claude Code Plugin Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
