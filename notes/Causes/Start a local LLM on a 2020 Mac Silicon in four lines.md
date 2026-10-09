---
published_at: "20261004"
---
*date* 20261004-40Su-277
*excerpt* CLI free with Ollama and Qwen2.5 on a 2020 Macbook Air (16GB RAM)

These four lines *finally* made me curious again about LLM-adjacent development.  I know other people have been on this for months now but I bet many more might appreciate this beacon of light as sail the seas of slop.

```sh
brew install ollama # llama.cpp wrapper + docker for models in Go
ollama serve # watch the log!

# open a new terminal screen
ollama pull qwen2.5-coder:1.5b  # install Alibaba's model – 1GB 
ollama run qwen2.5-coder:1.5b # run it – 5GB ram
```

Now, you can tweak the models, explore related logs, and of course pose nonsensical question while you work to regain your status as l33t h4x0r.

```
>>> You talkin' to me?
Yes, I am here. How may I assist you?
``` 

## On the tech

- **homebrew** - *the* package manager for Mac OS ([brew.sh](https://brew.sh/))
- **Qwen2.5** – Allibaba's LLM model that is "excellent for autocomplete and light agent tasks" ([qwen.com](https://qwen.ai/blog?id=qwen2.5)) ([hf/qwen2.5-coder:1.5b](https://ollama.com/library/qwen2.5-coder:7b)) ([wiki](https://en.wikipedia.org/wiki/Qwen)) ([hf/qwen 2.5 models](https://huggingface.co/collections/Qwen/qwen25))
- **Ollama** – "Docker for LLM models" written in Go. Widely used app for managing models with [open containers standards](https://github.com/opencontainers). Defaults to their registry. Runs LLM models *locally* with [GGUF](https://github.com/ggml-org/ggml/blob/master/docs/gguf.md) and the [llama.cpp](https://github.com/ggml-org/llama.cpp) backend. 
- **2020 M1 Macbook Air** with the non-standard 16GB RAM – 8GB standard version should work unless a lot of memory is already in use

Ollama lacks an out of the box metrics aggregator but has some verbose logging. Also, it is not specialized for Mac Silicon. So, consider  [oMLX](https://omlx.ai/) and [mlx-lm](https://github.com/ml-explore/mlx-lm) for using Mac Silicon's [MLX](https://opensource.apple.com/projects/mlx/).  For a GUI and image based workflows look at [LM Studio](https://lmstudio.ai/).  For local VSCode integration, consider [Cline](https://cline.bot/).

Qwen will not plan and fix *all* your friggin' code like more recent models.  But this setup won't go rogue, and it should not route anything to the magnanimous tech overlords. Indeed, now we can watch *both* sides of the chatbot conversation.  See the next post for that.

---

*next* [Look on my works ye mighty and despair](Look%20on%20my%20works%20ye%20mighty%20and%20despair.md)
*series* W1

---

*uses*  `homebrew, Ollama, Qwen2.5-Coder:1.5b`
*on* `2020 M1 Macbook Air 16GB RAM`
*assistance* `Gemini`

