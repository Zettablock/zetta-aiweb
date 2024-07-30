## Marketplace

### Model

Marketplace models

- Platform Base Models

  - meta-llama/Meta-Llama-3-8B from hugging face [link](https://platform.openai.com/playground/chat?models=gpt-4-turbo)
  - Claude 3 Opus (anthropic.claude-3-opus-20240229-v1:0) from AWS bedrock (see picture below)
  - gpt-4-turbo from OpenAI (link)
  - rest of models just pick some popular image, audio, video ones from HuggingFace

- User Public Models

### Data

Marketplace datasets

## Ai

### Playground

Public model inference Playground

### Notebooks

my notebooks

### Models

my models

### Serving

my deployed/running model to server

### Fune tuning Jobs

my fune tuning job

## Data Engineering

### Datasets

### Data integration

- data upload
- database connections
- zettablock query builder

### ZRunner

### Data Jobs

## User Flow

### Model Builder

-User SignIn & SignUp Flow

```mermaid
flowchart LR
    User --> isLoggedIn{{isLoggedIn}}
    isLoggedIn --Y--> RoutePage
    isLoggedIn --N--> AuthPage
    AuthPage --> Web3AuthUI --> isWeb3LoggedIn{{isWeb3LoggedIn}}
    isWeb3LoggedIn --Y--> IdToken--> AuthAPI
    isWeb3LoggedIn --N--> AuthPage
```

- Fine-tuning Model Flow

```mermaid
flowchart LR
    AIWeb --> Marketplace_Model[/Marketplace Model/] --> Model_Detail_Page --Fine-Tuning--> Model_Builder_Page[Model Builder Page]
    AIWeb --> UserProfile --connect--> PersonalGithub
    subgraph Model_Builder_Page
        start --input--> metadata --> Form
        start{{start}} --select--> BaseModel --> Form
        start --select multiple --> Datasets --> Form
        start --coding--> notebook
        Form --submit--> FineTuningJob
    end
    notebook --> PersonalGithub
    FineTuningJob --finished--> AI_Models
```

AI Playground Flow

```mermaid
flowchart LR
    AIWeb --> Marketplace_Model[/Marketplace Model/] --> Model_Detail_Page
    AIWeb --> AI_Models[/AI Models/] --> Model_Detail_Page
    Model_Detail_Page --USE--> Playground
    subgraph Playground
        start{{start}} --select--> Model --serving--> Inference
        Inference --> UI --> Streaming_Chat
        Inference --> API --> SDK
    end
```

Coding Notebook Flow

Data Prepare Flow

```mermaid
flowchart LR
    AIWeb --> Marketplace_Data[/Marketplace Data/] --> Dataset_Detail_Page
    AIWeb --> DataEng_Dataset[/DataEng Dataset/] --> Dataset_Detail_Page
    Dataset_Detail_Page <--by owner--> Data_Manage{{Data Manage}}
    subgraph Data_Manage
        Click_File --preview--> DataViwer
        Add_Data --upload--> Upload_Data_files
    end
```
