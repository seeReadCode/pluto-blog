---
published_at: "20261004"
---
*date* 20261004-40Su-277
*excerpt* Talk with Qwen2.5 on a 2020 Macbook Air (16GB RAM)

These four lines *finally* made me curious again about LLM-adjacent development.  I know other people have been on this for months now but I bet many more might appreciate this beacon of light as sail the seas of slop.

```sh
brew install ollama # llama.cpp wrapper + docker for models in Go
ollama serve # watch the log!

# open a new terminal screen
ollama pull qwen2.5-coder:1.5b  # install Alibaba's model – 1GB 
ollama run qwen2.5-coder:1.5b # run it – 5GB ram
```

Now we can watch *both* sides of the chatbot conversation.  

This should not route any of our precious model interaction to the magnanimous tech overlords.  But please beware rot and default opt-ins. 

## What are these things

- [homebrew](https://brew.sh/) - *the* package manager for Mac OS
- Qwen2.5 – Allibaba's LLM model that is "excellent for autocomplete and light agent tasks" ([qwen.com](https://qwen.ai/blog?id=qwen2.5)) ([hf/qwen2.5-coder:1.5b](https://ollama.com/library/qwen2.5-coder:7b)) ([wiki](https://en.wikipedia.org/wiki/Qwen)) ([hf/qwen 2.5 models](https://huggingface.co/collections/Qwen/qwen25))
- Ollama – llama.cpp wrapper + "Docker for models" in Go managing models using [open containers standards](https://github.com/opencontainers) via registries – defaulting to their own – and running LLM models *locally* with [GGUF](https://github.com/ggml-org/ggml/blob/master/docs/gguf.md) and the [llama.cpp](https://github.com/ggml-org/llama.cpp) backend. 

Ollama lacks metrics out of the box is not specialized for Mac Silicon so later I will look at  [oMLX](https://omlx.ai/) and [mlx-lm](https://github.com/ml-explore/mlx-lm) for using Mac Silicon's [MLX](https://opensource.apple.com/projects/mlx/) as well as [LM Studio](https://lmstudio.ai/)

Anyways – have fun!

*next* [Look on my works ye mighty and despair](Look%20on%20my%20works%20ye%20mighty%20and%20despair.md)
*series* W1

*uses*  `homebrew, Ollama, Qwen2.5-Coder:1.5b`
*on* `2020 M1 Macbook Air 16GB RAM`
*assistance* `Gemini`

