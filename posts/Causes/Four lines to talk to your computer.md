---
published_at: "20261004"
---
*date* 20261004-40Su-277
*series* W1
*uses*  `homebrew, Ollama, Qwen2.5-Coder:1.5b`
*on* `2020 M1 Macbook Air 16GB RAM`
*assistance* `Gemini`

Well, these four lines finally made me curious again about LLM-adjacent development so I figured I should share them..

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
- Qwen2.5 – LLM model that is "excellent for autocomplete and light agent tasks" ([huggingface/qwen2.5-coder:1.5b](https://ollama.com/library/qwen2.5-coder:7b)) ([qwen.com on 2.5](https://qwen.ai/blog?id=qwen2.5)) ([wiki](https://en.wikipedia.org/wiki/Qwen)) ([hf/qwen 2.5 models](https://huggingface.co/collections/Qwen/qwen25))
- Ollama – llama.cpp wrapper + Docker for models in Go managing using OCI standard and running LLM models. [GGUF](https://github.com/ggml-org/ggml/blob/master/docs/gguf.md) and [llama.cpp](https://github.com/ggml-org/llama.cpp) backends. Lacks metrics out of the box and not specialized for Mac Silicon.  c.f.  oMLX which native MLX-LM formatting

Have fun!

