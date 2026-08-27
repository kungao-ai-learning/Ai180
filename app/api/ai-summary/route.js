export async function POST(request) {
  try {
    const body = await request.json();

    const learning_note =
      body.learning_note || "";

    const result_note =
      body.result_note || "";

    if (!learning_note && !result_note) {
      return Response.json(
        {
          error: "请先填写学习心得或成果输出"
        },
        {
          status: 400
        }
      );
    }

    const apiKey =
      process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return Response.json(
        {
          error:
            "服务器没有配置 DEEPSEEK_API_KEY"
        },
        {
          status: 500
        }
      );
    }

    const prompt = `
你是我的 AI 职业转型学习助手。

我正在进行一个180天的AI职业转型计划。

请根据我今天的学习记录，生成一份简洁、实用的学习总结。

【今日学习心得】
${learning_note}

【今日成果输出】
${result_note}

请按照以下结构输出：

今日学习总结：

1. 今天学到了什么
2. 今天完成了什么
3. 今天形成了什么能力
4. 下一步建议

要求：
- 使用中文
- 不要编造我没有完成的事情
- 不要夸大成果
- 重点关注 AI、产品、自动化、数字化能力
- 语言简洁
- 控制在300字以内
`;

    const response =
      await fetch(
        "https://api.deepseek.com/chat/completions",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${apiKey}`
          },

          body: JSON.stringify({
            model:
              "deepseek-v4-flash",

            messages: [
              {
                role: "system",
                content:
                  "你是一名专业的AI职业转型学习教练。"
              },

              {
                role: "user",
                content: prompt
              }
            ],

            stream: false,

            temperature: 0.3,

            max_tokens: 800
          })
        }
      );

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "DeepSeek API错误:",
        errorText
      );

      return Response.json(
        {
          error:
            "AI接口调用失败"
        },
        {
          status: 500
        }
      );
    }

    const data =
      await response.json();

    const summary =
      data?.choices?.[0]?.message?.content ||
      "";

    if (!summary) {
      return Response.json(
        {
          error:
            "AI没有返回总结内容"
        },
        {
          status: 500
        }
      );
    }

    return Response.json({
      summary
    });

  } catch (error) {

    console.error(
      "AI总结接口错误:",
      error
    );

    return Response.json(
      {
        error:
          "AI总结接口发生错误"
      },
      {
        status: 500
      }
    );
  }
}
