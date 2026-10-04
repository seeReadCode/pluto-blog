---
published_at: "20261004"
---
*date* 20261004-40Su-277
*from* [Four lines to talk to a local LLM on old Mac Silicon](Four%20lines%20to%20talk%20to%20a%20local%20LLM%20on%20old%20Mac%20Silicon.md)
*excerpt* The lone and level logs stretch far away

*caveat*  You will want a big/second screen if you try this at home.

So run the ollama server with our qwen model... 

```sh
ollama serve
#new terminal
ollama run qwen2.5-coder:1.5b
```

And then tell Qwen something...

```ollama
>>> Look on my works ye mighty and despair.

I understand that you may be feeling
overwhelmed or anxious, and that's completely
normal. It's important to take care of yourself
and seek support when you need it. If you're
looking for guidance or someone to talk to, I'd
be happy to help.
```


**Let's look at the logs** –  here's what the `ollama serve` binary logged on `POST /api/generate` for my quote of Shelley's 1818 "Ozymandias" ([wiki](https://en.wikipedia.org/wiki/Ozymandias)) .

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

We can look at the actual `POST`s later.

But if that's a doozy, consider the `init` log ....

``` log
time=2026-10-04T10:44:07.135-04:00 level=INFO source=server.go:100 msg="using llama-server for model" model=/Users/corndog/.ollama/models/blobs/sha256-29d8c98fa6b098e200069bfb88b9508dc3e85586d20cba59f8dda9a808165104
time=2026-10-04T10:44:07.136-04:00 level=INFO source=llama_server.go:436 msg="starting llama-server" cmd="/opt/homebrew/Cellar/ollama/0.35.0/libexec/lib/ollama/llama-server --model /Users/corndog/.ollama/models/blobs/sha256-29d8c98fa6b098e200069bfb88b9508dc3e85586d20cba59f8dda9a808165104 --port 54958 --host 127.0.0.1 --no-webui --offline -c 4096 -np 1 --log-verbosity 4 --no-log-prefix --no-log-timestamps --no-jinja --chat-template chatml --flash-attn auto -b 512 -ub 512 --context-shift --keep 4"
time=2026-10-04T10:44:07.137-04:00 level=INFO source=sched.go:618 msg="system memory" total="16.0 GiB" free="5.3 GiB" free_swap="0 B"
time=2026-10-04T10:44:07.137-04:00 level=INFO source=sched.go:625 msg="gpu memory" id=0 library=Metal available="11.3 GiB" free="11.8 GiB" minimum="512.0 MiB" overhead="0 B"
time=2026-10-04T10:44:07.137-04:00 level=INFO source=llama_server.go:1054 msg="loading model via llama-server" model=/Users/corndog/.ollama/models/blobs/sha256-29d8c98fa6b098e200069bfb88b9508dc3e85586d20cba59f8dda9a808165104
time=2026-10-04T10:44:07.137-04:00 level=INFO source=llama_server.go:1307 msg="waiting for llama-server to start responding"
time=2026-10-04T10:44:07.138-04:00 level=INFO source=llama_server.go:1362 msg="waiting for llama-server to become available" status="llm server not responding"
0.00.000.081 I srv  llama_server: initializing ...
cmn  common_param: common_params_print_info: build 11081 (161755f29) with AppleClang 21.0.0.21000334 for Darwin arm64
cmn  common_param: common_params_print_info: verbosity = 4 (adjust with the `-lv N` CLI arg)
cmn  common_param: device_info:
cmn  common_param:   - MTL0    : Apple M1 (12124 MiB, 12123 MiB free)
cmn  common_param:   - BLAS    : Accelerate (0 MiB, 0 MiB free)
cmn  common_param:   - CPU     : Apple M1 (16384 MiB, 16384 MiB free)
cmn  common_param: system_info: n_threads = 4 (n_threads_batch = 4) / 8 | MTL : EMBED_LIBRARY = 1 | CPU : NEON = 1 | ARM_FMA = 1 | FP16_VA = 1 | DOTPROD = 1 | LLAMAFILE = 1 | ACCELERATE = 1 | REPACK = 1 |
srv          init: using 7 threads for HTTP server
srv          init: The UI is disabled
srv          init: Use --ui/--no-ui (or deprecated --webui/--no-webui) to enable/disable
srv  llama_server: security: no API key is set and CORS allows all origins (see https://github.com/ggml-org/llama.cpp/pull/25655)
srv         start: binding port with default address family
srv    load_model: loading model '/Users/corndog/.ollama/models/blobs/sha256-29d8c98fa6b098e200069bfb88b9508dc3e85586d20cba59f8dda9a808165104'
srv    load_model: local path '/Users/corndog/.ollama/models/blobs/sha256-29d8c98fa6b098e200069bfb88b9508dc3e85586d20cba59f8dda9a808165104'
cmn  common_init_: fitting params to device memory ...
cmn  common_init_: (for bugs during this step try to reproduce them with -fit off, or provide --verbose logs if the bug only occurs with -fit on)
common_params_fit_impl: getting device memory data for initial parameters:
common_memory_breakdown_print: | memory breakdown [MiB] | total    free    self   model   context   compute    unaccounted |
common_memory_breakdown_print: |   - MTL0 (Apple M1)    | 12124 = 12123 + (1109 =   934 +     112 +      62) +       -1108 |
common_memory_breakdown_print: |   - Host               |                   202 =   182 +       0 +      20                |
common_params_fit_impl: projected to use 1109 MiB of device memory vs. 12123 MiB of free device memory
common_params_fit_impl: will leave 11014 >= 1024 MiB of free device memory, no changes needed
common_fit_params: successfully fit params to free device memory
common_fit_params: fitting params to free memory took 0.17 seconds
time=2026-10-04T10:44:07.389-04:00 level=INFO source=llama_server.go:1362 msg="waiting for llama-server to become available" status="llm server loading model"
llama_model_loader: loaded meta data with 34 key-value pairs and 338 tensors from /Users/corndog/.ollama/models/blobs/sha256-29d8c98fa6b098e200069bfb88b9508dc3e85586d20cba59f8dda9a808165104 (version GGUF V3 (latest))
llama_model_loader: Dumping metadata keys/values. Note: KV overrides do not apply in this output.
llama_model_loader: - kv   0:                       general.architecture str              = qwen2
llama_model_loader: - kv   1:                               general.type str              = model
llama_model_loader: - kv   2:                               general.name str              = Qwen2.5 Coder 1.5B Instruct
llama_model_loader: - kv   3:                           general.finetune str              = Instruct
llama_model_loader: - kv   4:                           general.basename str              = Qwen2.5-Coder
llama_model_loader: - kv   5:                         general.size_label str              = 1.5B
llama_model_loader: - kv   6:                            general.license str              = apache-2.0
llama_model_loader: - kv   7:                       general.license.link str              = https://huggingface.co/Qwen/Qwen2.5-C...
llama_model_loader: - kv   8:                   general.base_model.count u32              = 1
llama_model_loader: - kv   9:                  general.base_model.0.name str              = Qwen2.5 Coder 1.5B
llama_model_loader: - kv  10:          general.base_model.0.organization str              = Qwen
llama_model_loader: - kv  11:              general.base_model.0.repo_url str              = https://huggingface.co/Qwen/Qwen2.5-C...
llama_model_loader: - kv  12:                               general.tags arr[str,6]       = ["code", "codeqwen", "chat", "qwen", ...
llama_model_loader: - kv  13:                          general.languages arr[str,1]       = ["en"]
llama_model_loader: - kv  14:                          qwen2.block_count u32              = 28
llama_model_loader: - kv  15:                       qwen2.context_length u32              = 32768
llama_model_loader: - kv  16:                     qwen2.embedding_length u32              = 1536
llama_model_loader: - kv  17:                  qwen2.feed_forward_length u32              = 8960
llama_model_loader: - kv  18:                 qwen2.attention.head_count u32              = 12
llama_model_loader: - kv  19:              qwen2.attention.head_count_kv u32              = 2
llama_model_loader: - kv  20:                       qwen2.rope.freq_base f32              = 1000000.000000
llama_model_loader: - kv  21:     qwen2.attention.layer_norm_rms_epsilon f32              = 0.000001
llama_model_loader: - kv  22:                          general.file_type u32              = 15
llama_model_loader: - kv  23:                       tokenizer.ggml.model str              = gpt2
llama_model_loader: - kv  24:                         tokenizer.ggml.pre str              = qwen2
llama_model_loader: - kv  25:                      tokenizer.ggml.tokens arr[str,151936]  = ["!", "\"", "#", "$", "%", "&", "'", ...
llama_model_loader: - kv  26:                  tokenizer.ggml.token_type arr[i32,151936]  = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, ...
llama_model_loader: - kv  27:                      tokenizer.ggml.merges arr[str,151387]  = ["Ġ Ġ", "ĠĠ ĠĠ", "i n", "Ġ t",...
llama_model_loader: - kv  28:                tokenizer.ggml.eos_token_id u32              = 151645
llama_model_loader: - kv  29:            tokenizer.ggml.padding_token_id u32              = 151643
llama_model_loader: - kv  30:                tokenizer.ggml.bos_token_id u32              = 151643
llama_model_loader: - kv  31:               tokenizer.ggml.add_bos_token bool             = false
llama_model_loader: - kv  32:                    tokenizer.chat_template str              = {%- if tools %}\n    {{- '<|im_start|>...
llama_model_loader: - kv  33:               general.quantization_version u32              = 2
llama_model_loader: - type  f32:  141 tensors
llama_model_loader: - type q4_K:  168 tensors
llama_model_loader: - type q6_K:   29 tensors
print_info: file format = GGUF V3 (latest)
print_info: file type   = Q4_K - Medium
print_info: file size   = 934.69 MiB (5.08 BPW)
llama_prepare_model_devices: using device MTL0 (Apple M1) (unknown id) - 12123 MiB free
load: 0 unused tokens
load: control-looking token: 128247 '</s>' was not control-type; this is probably a bug in the model. its type will be overridden
load: printing all EOG tokens:
load:   - 128247 ('</s>')
load:   - 151643 ('<|endoftext|>')
load:   - 151645 ('<|im_end|>')
load:   - 151662 ('<|fim_pad|>')
load:   - 151663 ('<|repo_name|>')
load:   - 151664 ('<|file_sep|>')
load: special tokens cache size = 23
load: token to piece cache size = 0.9310 MB
print_info: arch                  = qwen2
print_info: vocab_only            = 0
print_info: no_alloc              = 0
print_info: n_ctx_train           = 32768
print_info: n_embd_inp            = 1536
print_info: n_embd                = 1536
print_info: n_embd_out            = 1536
print_info: n_layer               = 28
print_info: n_layer_all           = 28
print_info: n_head                = 12
print_info: n_head_kv             = 2
print_info: n_rot                 = 128
print_info: n_swa                 = 0
print_info: is_swa_any            = 0
print_info: non_causal_type       = 0
print_info: n_embd_head_k         = 128
print_info: n_embd_head_v         = 128
print_info: n_gqa                 = 6
print_info: n_embd_k_gqa          = 256
print_info: n_embd_v_gqa          = 256
print_info: f_norm_eps            = 0.0e+00
print_info: f_norm_rms_eps        = 1.0e-06
print_info: f_clamp_kqv           = 0.0e+00
print_info: f_max_alibi_bias      = 0.0e+00
print_info: f_logit_scale         = 0.0e+00
print_info: f_attn_scale          = 0.0e+00
print_info: f_attn_value_scale    = 0.0000
print_info: n_ff                  = 8960
print_info: n_expert              = 0
print_info: n_expert_used         = 0
print_info: n_expert_groups       = 0
print_info: n_group_used          = 0
print_info: causal attn           = 1
print_info: pooling type          = -1
print_info: rope type             = 2
print_info: rope scaling          = linear
print_info: freq_base_train       = 1000000.0
print_info: freq_scale_train      = 1
print_info: n_ctx_orig_yarn       = 32768
print_info: rope_yarn_log_mul     = 0.0000
print_info: rope_finetuned        = unknown
print_info: model type            = 1.5B
print_info: model params          = 1.54 B
print_info: general.name          = Qwen2.5 Coder 1.5B Instruct
print_info: vocab type            = BPE
print_info: n_vocab               = 151936
print_info: n_merges              = 151387
print_info: BOS token             = 151643 '<|endoftext|>'
print_info: EOS token             = 151645 '<|im_end|>'
print_info: EOT token             = 151645 '<|im_end|>'
print_info: PAD token             = 151643 '<|endoftext|>'
print_info: LF token              = 198 'Ċ'
print_info: FIM PRE token         = 151659 '<|fim_prefix|>'
print_info: FIM SUF token         = 151661 '<|fim_suffix|>'
print_info: FIM MID token         = 151660 '<|fim_middle|>'
print_info: FIM PAD token         = 151662 '<|fim_pad|>'
print_info: FIM REP token         = 151663 '<|repo_name|>'
print_info: FIM SEP token         = 151664 '<|file_sep|>'
print_info: EOG token             = 128247 '</s>'
print_info: EOG token             = 151643 '<|endoftext|>'
print_info: EOG token             = 151645 '<|im_end|>'
print_info: EOG token             = 151662 '<|fim_pad|>'
print_info: EOG token             = 151663 '<|repo_name|>'
print_info: EOG token             = 151664 '<|file_sep|>'
print_info: max token length      = 256
load_tensors: loading model tensors, this can take a while... (load_mode = mmap)
load_tensors: offloading output layer to GPU
load_tensors: offloading 27 repeating layers to GPU
load_tensors: offloaded 29/29 layers to GPU
load_tensors:   CPU_Mapped model buffer size =   182.57 MiB
load_tensors:  MTL0_Mapped model buffer size =   934.69 MiB
cmn  common_init_: added </s> logit bias = -inf
cmn  common_init_: added <|endoftext|> logit bias = -inf
cmn  common_init_: added <|im_end|> logit bias = -inf
cmn  common_init_: added <|fim_pad|> logit bias = -inf
cmn  common_init_: added <|repo_name|> logit bias = -inf
cmn  common_init_: added <|file_sep|> logit bias = -inf
llama_context: constructing llama_context
llama_context: n_seq_max             = 1
llama_context: n_ctx                 = 4096
llama_context: n_ctx_seq             = 4096
llama_context: n_batch               = 512
llama_context: n_ubatch              = 512
llama_context: causal_attn           = 1
llama_context: flash_attn            = auto
llama_context: kv_unified            = false
llama_context: freq_base             = 1000000.0
llama_context: freq_scale            = 1
llama_context: n_rs_seq              = 0
llama_context: n_outputs_max         = 1
llama_context: n_outputs_max_per_seq = 1
llama_context: n_ctx_seq (4096) < n_ctx_train (32768) -- the full capacity of the model will not be utilized
ggml_metal_init: allocating
ggml_metal_init: found device: Apple M1
ggml_metal_init: picking default device: Apple M1
ggml_metal_init: use fusion         = true
ggml_metal_init: use concurrency    = true
ggml_metal_init: use graph optimize = true
llama_context:        CPU  output buffer size =     0.58 MiB
llama_kv_cache:       MTL0 KV buffer size =   112.00 MiB
llama_kv_cache: size =  112.00 MiB (  4096 cells,  28 layers,  1/1 seqs), K (f16):   56.00 MiB, V (f16):   56.00 MiB
llama_kv_cache: attn_rot_k = 0, n_embd_head_k_all = 128
llama_kv_cache: attn_rot_v = 0, n_embd_head_k_all = 128
sched_reserve: reserving ...
resolve_fused_ops: Flash Attention enabled
resolve_fused_ops: resolving fused DeepSeek V4 HC support:
resolve_fused_ops: fused DeepSeek V4 HC pre enabled
resolve_fused_ops: fused DeepSeek V4 HC comb enabled
resolve_fused_ops: fused DeepSeek V4 HC post enabled
sched_reserve:       MTL0 compute buffer size =    62.51 MiB
sched_reserve:        CPU compute buffer size =    10.01 MiB
sched_reserve: graph nodes  = 958
sched_reserve: graph splits = 2
sched_reserve: reserve took 11.49 ms, sched copies = 1
cmn          init: llama threadpool init, n_threads = 4
cmn  common_init_: warming up the model with an empty run - please wait ... (--no-warmup to disable)
srv    load_model: initializing, n_slots = 1, n_ctx_slot = 4096, kv_unified = 'false'
spec common_specu: no implementations specified for speculative decoding
slot   load_model: id  0 | task -1 | new slot, n_ctx = 4096
srv    load_model: prompt cache is enabled, size limit: 8192 MiB
srv    load_model: use `--cache-ram 0` to disable the prompt cache
srv    load_model: for more info see https://github.com/ggml-org/llama.cpp/pull/16391
srv    load_model: context checkpoints enabled, max = 32, min spacing = 8192
srv          init: idle slots will be saved to prompt cache upon starting a new task
srv          init: init: chat template, example_format: '<|im_start|>system
You are a helpful assistant<|im_end|>
<|im_start|>user
Hello<|im_end|>
<|im_start|>assistant
Hi there<|im_end|>
<|im_start|>user
How are you?<|im_end|>
<|im_start|>assistant
'
srv          init: init: chat template, thinking = 0
srv          init: preserve_reasoning kwarg: not supported by template
srv  llama_server: model loaded
srv  llama_server: listening on http://127.0.0.1:54958
srv  update_slots: all slots are idle
time=2026-10-04T10:44:08.145-04:00 level=INFO source=llama_server.go:1374 msg="llama-server started in 1.01 seconds"
time=2026-10-04T10:44:08.145-04:00 level=INFO source=images.go:383 msg="template selection" model=registry.ollama.ai/library/qwen2.5-coder:1.5b selected=go_template renderer="" parser="" go_template="[completion tools insert]" chat_template="[tools completion]" harmony=null renderer_parser=null
time=2026-10-04T10:44:08.145-04:00 level=INFO source=sched.go:733 msg="loaded runners" count=1
time=2026-10-04T10:44:08.145-04:00 level=INFO source=llama_server.go:1307 msg="waiting for llama-server to start responding"
time=2026-10-04T10:44:08.146-04:00 level=INFO source=llama_server.go:1374 msg="llama-server started in 1.01 seconds"
```

Lots of fun to be had here.  I'll dig into these tomorrow.

*series* W1

*next* [Look on my works ye mighty and despair](Look%20on%20my%20works%20ye%20mighty%20and%20despair.md)
*series* W1
*uses*  `Ollama, Qwen2.5-Coder:1.5b`
*on* `2020 M1 Macbook Air 16GB RAM`
*assistance* `Gemini`