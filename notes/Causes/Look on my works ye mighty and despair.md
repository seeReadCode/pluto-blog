---
published_at: "20261004"
---
*date* 20261004-40Su-277
*from* [Four lines to talk to a local LLM on old Mac Silicon](Four%20lines%20to%20talk%20to%20a%20local%20LLM%20on%20old%20Mac%20Silicon.md)
*excerpt* The lone and level logs stretch far away
*caveat*  You may want a big/second screen if you try this at home.

---

Run our Ollama server with our Qwen model... 

```sh
ollama serve
#new terminal
ollama run qwen2.5-coder:1.5b
```

And tell Qwen something...

```ollama
>>> Look on my works ye mighty and despair.

I understand that you may be feeling
overwhelmed or anxious, and that's completely
normal. It's important to take care of yourself
and seek support when you need it. If you're
looking for guidance or someone to talk to, I'd
be happy to help.
```

Well, what did you expect a coder bot to say?

**Let's look at the logs**. Here's what the `ollama serve` binary logged after the `POST /api/generate` of my quote of Shelley's 1818 "Ozymandias" ([wiki](https://en.wikipedia.org/wiki/Ozymandias)) .

```log
[GIN] 2026/10/04 - 10:44:08 | 200 |  1.041500125s |       127.0.0.1 | POST     "/api/generate"
srv  server_strea: conv_id= (empty=1)
slot get_availabl: id  0 | task -1 |  - skipping, slot is empty
slot get_availabl: id  0 | task -1 | selected slot by LRU, t_last = -1
srv  get_availabl: updating prompt cache
srv          load:  - looking for better prompt, base f_keep = -1.000, f_sim = 0.000
srv        update:  - cache state: 0 prompts, 0.000 MiB (limits: 8192.000 MiB, 4096 tokens, 8589934592 est)
srv  get_availabl: prompt cache update took 0.01 ms
slot launch_slot_: id  0 | task -1 | sampler chain: logits -> ?penalties -> ?dry -> ?top-n-sigma -> top-k -> ?typical -> top-p -> ?min-p -> ?xtc -> temp-ext -> dist
slot launch_slot_: id  0 | task -1 | sampler params:
	repeat_last_n = 64, repeat_penalty = 1.000, frequency_penalty = 0.000, presence_penalty = 0.000
	dry_multiplier = 0.000, dry_base = 1.750, dry_allowed_length = 2, dry_penalty_last_n = 64
	top_k = 40, top_p = 0.900, min_p = 0.000, xtc_probability = 0.000, xtc_threshold = 0.100, typical_p = 1.000, top_n_sigma = -1.000, temp = 0.800
	mirostat = 0, mirostat_lr = 0.100, mirostat_ent = 5.000, adaptive_target = -1.000, adaptive_decay = 0.900
slot launch_slot_: id  0 | task 0 | processing task, is_child = 0
slot   operator(): id  0 | task 0 | new prompt, n_ctx_slot = 4096, n_keep = 4, task.n_tokens = 37
slot   operator(): id  0 | task 0 | cached n_tokens = 0, memory_seq_rm [0, end)
slot init_sampler: id  0 | task 0 | init sampler, took 0.01 ms, tokens: text = 37, total = 37
slot print_timing: id  0 | task 0 | prompt eval time =     263.25 ms /    37 tokens (    7.11 ms per token,   140.55 tokens per second)
slot print_timing: id  0 | task 0 |        eval time =    1008.60 ms /    53 tokens (   19.40 ms per token,    51.56 tokens per second)
slot print_timing: id  0 | task 0 |       total time =    1271.85 ms /    90 tokens
slot print_timing: id  0 | task 0 |    graphs reused =         52
slot      release: id  0 | task 0 | stop processing: n_tokens = 89, truncated = 0
srv  update_slots: all slots are idle
[GIN] 2026/10/04 - 10:47:53 | 200 |  1.282435416s |       127.0.0.1 | POST     "/api/chat"
```

Here's how Claude's Sonnet 5.5 explained it to me.

> ### Server and slot setup
> 
> - **srv / slot**: `srv` is the inference server. A **slot** is one independent sequence with its own KV cache (the model's memory of the tokens so far). Parallel requests use separate slots.
> - **conv_id empty**: no conversation ID was supplied, so nothing is reused.
> - **selected slot by LRU, t_last = -1**: with several slots, the least recently used is picked. `-1` means this one has never been used.
> - **prompt cache**: a store of earlier prompts' KV states so repeated prefixes don't need reprocessing. `f_keep` is the fraction of the existing slot's cache that matches the new prompt, and `f_sim` is similarity to cached prompts. Both are empty or zero because it's a cold start. The cache is at 0 prompts, with limits of 8192 MiB and 4096 tokens.
> 
> ### Context and prompt
> 
> - **n_ctx_slot = 4096**: this slot's context window, covering prompt plus output.
> - **n_keep = 4**: tokens always preserved at the start if the context fills up and must be shifted (typically BOS and the start of the system prompt).
> - **task.n_tokens = 37**: the prompt is 37 tokens.
> - **cached n_tokens = 0, memory_seq_rm [0, end)**: nothing could be reused, so the KV cache for the sequence is cleared and the whole prompt is processed.
> 
> 
> ### Sampler chain and parameters
> 
> Each generated token passes through these filters in order: `logits -> penalties -> dry -> top-n-sigma -> top-k -> typical -> top-p -> min-p -> xtc -> temp -> dist`. The `?` marks samplers that are optional and inactive with the current values (neutral settings).
> 

With a nice table to explain some of the key params:

|Parameter|Value|Meaning|
|---|---|---|
|`temp`|0.8|Randomness. Lower is more deterministic, higher is more varied.|
|`top_k`|40|Only the 40 most likely tokens are candidates.|
|`top_p`|0.9|Keep the smallest set of tokens whose probabilities sum to 90%.|
|`min_p`|0|Disabled. Otherwise drops tokens below a fraction of the top token's probability.|
|`typical_p`|1.0|Disabled.|
|`repeat_penalty` / `repeat_last_n`|1.0 / 64|No penalty. If raised, it would apply to the last 64 tokens.|
|`frequency_penalty`, `presence_penalty`|0|Disabled. They penalize tokens by how often or whether they've already appeared.|
|`dry_*`|multiplier 0|DRY ("Don't Repeat Yourself") penalizes repeated sequences. Off because the multiplier is 0.|
|`xtc_*`|probability 0|"Exclude Top Choices" occasionally removes the most likely tokens to boost creativity. Off.|
|`top_n_sigma`|-1|Disabled.|
|`mirostat`|0|Disabled. The adaptive perplexity-targeting alternative to top-k/top-p.|
|`dist`|final step|Randomly draws from the remaining distribution.|
> 
> ### Timing
> 
> - **prompt eval**: 37 tokens in 263 ms (140 tokens/s). This is the "prefill" stage, which is parallel and fast.
> - **eval**: 53 tokens generated in 1008 ms (51.6 tokens/s). This is the decode stage, one token at a time, and it's the speed you feel.
> - **total**: 1272 ms for 90 tokens.
> - **graphs reused = 52**: the compute graph was built once and reused for the other 52 decode steps, which saves overhead.
> - **release, n_tokens = 89, truncated = 0**: the slot holds 89 tokens in its KV cache (the last sampled token isn't stored yet), and nothing was cut off by the context limit. Then all slots go idle.
> 
> ## How configuration changes would affect output
> 
> **Output style and quality** (set per request in `options`, or in a Modelfile with `PARAMETER`):
> 
> - **temperature**: lowering to 0–0.3 gives focused, repeatable answers, which suits code, extraction, and factual tasks. Raising to 1.0+ gives more creative but less reliable output.
> - **top_k / top_p / min_p**: tightening them (e.g. top_p 0.7, top_k 20) trims unlikely tokens and makes output safer and blander. Loosening them increases variety and the chance of oddities. `min_p` around 0.05 is a popular alternative that adapts to the model's confidence.
> - **repeat_penalty** (1.05–1.2): reduces looping and repeated phrases, but too high makes the model avoid necessary repeats such as names and code identifiers.
> - **presence/frequency penalties**: nudge toward new topics or vocabulary.
> - **seed** (with low temperature): makes results reproducible.
> - **mirostat 1 or 2**: replaces top-k/top-p with feedback control. It keeps output "interestingness" steady, which helps in long creative text.
> - **num_predict**: caps output length. Too low truncates answers mid-sentence.
> - **stop**: custom stop sequences end generation early.
> 
> **Context and memory:**
> 
> - **num_ctx** (here 4096): raising it lets you send longer prompts or conversations, but KV cache memory grows linearly with it. Too large can push layers off the GPU and slow everything down. Too small silently drops old conversation content, so the model "forgets" earlier turns (the `truncated` flag would show it).
> - **num_keep**: protects the first N tokens (like a system prompt) from being discarded when the context shifts.
> - **OLLAMA_KV_CACHE_TYPE** (`q8_0`/`q4_0`) with **OLLAMA_FLASH_ATTENTION=1**: shrinks KV cache memory, allowing larger contexts, with a small quality cost.
> 
> **Speed and resources:**
> 
> - **num_gpu** (layers offloaded): more layers on GPU means faster decode. Your 51 tokens/s suggests it is probably well offloaded already.
> - **num_thread**: only matters for CPU inference. Setting it to your physical core count is usually best.
> - **num_batch**: larger batches speed up prompt processing, with more memory use.
> - **OLLAMA_NUM_PARALLEL**: more slots allow concurrent requests, but the context is divided among them (4 slots at 8192 context gives 2048 each), and per-request speed may drop.
> - **OLLAMA_KEEP_ALIVE**: how long the model stays loaded. Keeping it loaded avoids reload delay on the next request. A shorter value frees VRAM sooner.
> - **Prompt cache hits**: when consecutive requests share a long prefix (like a system prompt), prompt eval time drops sharply. That's most noticeable with long prompts. With your 37-token prompt it hardly matters.
> 
> Some of the newer samplers (DRY, XTC, top-n-sigma) may not be exposed as settings in all Ollama versions, so check your version's docs before relying on them. If you share your Modelfile or environment variables, I can suggest specific values for your use case.

Next let's look at the the `modelfile`.

---

*next* She's a Model and She's Looking Good
*series* W1

---

*uses*  `Ollama, Qwen2.5-Coder:1.5b`
*tutor* `Sonnet5.5-Medium`
*on* `2020 M1 Macbook Air 16GB RAM`