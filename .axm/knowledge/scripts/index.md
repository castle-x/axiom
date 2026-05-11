<!-- axm-meta
status: active
last-reviewed: 2026-05-11
owner: axm-skill
entries:
  - path: overview.md
    title: 脚本子系统速查
    when-to-read: 了解三个主脚本与 _lib 共享模块的关系、接口与调用链
-->


# scripts/ — 脚本子系统

axm 的"机械层"实现，负责 AI 判断不到的部分：模板释放、契约校验、索引同步。

## 访问约定

1. 初读 `overview.md`（速查）
2. 修改具体脚本前先读 `.axm/project/coding.md` 的"脚本"章节
