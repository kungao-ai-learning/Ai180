export async function POST() {

  try {


    const apiKey =
      process.env.DEEPSEEK_API_KEY;



    if(!apiKey){

      return Response.json(
        {
          error:
          "没有配置AI Key"
        },
        {
          status:500
        }
      );

    }



    const response =
    await fetch(
      "https://api.deepseek.com/chat/completions",
      {

        method:"POST",

        headers:{

          "Content-Type":
          "application/json",

          "Authorization":
          `Bearer ${apiKey}`

        },


        body:JSON.stringify({

          model:
          "deepseek-v4-flash",


          messages:[

            {

              role:"system",

              content:
              "你是一名AI职业转型导师，帮助用户总结180天成长路线。"

            },


            {

              role:"user",

              content:
`
请生成一份AI职业成长报告。

报告结构：

1. 我的学习历程

2. 已掌握AI能力

3. 完成的实践成果

4. 我的职业转型优势

5. 下一阶段学习建议


要求：
中文输出。
结合AI产品、数字化、自动化方向。
语言适合放入个人作品集。
`

            }

          ],


          temperature:
          0.3,


          max_tokens:
          1500


        })

      }
    );



    const data =
    await response.json();



    return Response.json({

      report:
      data
      ?.choices?.[0]
      ?.message
      ?.content
      ||
      ""

    });



  }catch(error){


    return Response.json(

      {

        error:
        error.message

      },

      {

        status:500

      }

    );


  }

}
