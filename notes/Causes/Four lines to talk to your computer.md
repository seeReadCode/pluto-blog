---
published_at: "20261004"
---
*date* 20261004-40Su-277
*series* W1
*uses*  `homebrew, Ollama, Qwen2.5-Coder:1.5b`
*on* `2020 M1 Macbook Air 16GB RAM`
*assistance* `Gemini`

Well these four lines got my curious again so I figured I should share them..

```sh
brew install ollama # llama.cpp wrapper + docker for models in Go
ollama serve # watch the log!

# open a new terminal screen
ollama pull qwen2.5-coder:1.5b  # install Alibaba's model – 1GB 
ollama run qwen2.5-coder:1.5b # run it – 5GB ram
```

Now we can watch *both* sides of the chatbot conversation.  

At the moment my understanding is that this will not route any of your precious model interaction to our magnanimous tech overlords.  But – beware rot and default opt-ins. 

## What are these things

- [homebrew](https://brew.sh/) - package manager for Mac OS
- Qwen2.5 – LLM model that is "excellent for autocomplete and light agent tasks"
- Ollama – Go based app for managing LLMs models. Lacks metrics, not specialized for Mac Silicon.  `GGUF` and `llama.cpp` backends c.f.  oMLX which native MLX-LM formatting

Have fun!

