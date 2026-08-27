export async function POST(request) {

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



    const body =
      await request.json();



    const tasks =
      body.tasks || [];


    const records =
      body.records || {};



    const completedTasks =
      tasks.filter(
        task =>
        records[task.day]
        ?.status === "completed"
      );



    const learningData = 
      completedTasks.map(
        task => ({

          day:
          task.day,


          phase:
          task.phase,


          title:
          task.title,


          learning:
          records[task.day]
          ?.learning_note
          || "",


          result:
          records[task.day]
          ?.result_note
          || "",


          ai_summary:
          records[task.day]
          ?.ai_summary
          || ""

        })
      );




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

`
你是一名AI职业转型导师。

你的任务是根据用户真实180天学习数据，
生成一份个人AI成长报告。

报告需要像个人作品集内容，
突出：
1. AI能力成长
2. 产品思维
3. 数字化能力
4. 自动化实践能力
5. 职业转型价值

不要编造没有的数据。
`

          },


          {


            role:"user",


            content:

`
请根据以下真实学习记录，
生成我的AI成长报告。

学习数据：

${JSON.stringify(
learningData,
null,
2
)}


报告结构：

一、我的180天AI学习历程

二、已掌握的AI能力

三、完成的实践成果

四、我的职业转型优势

五、未来职业方向建议


要求：

中文输出。

适合作为个人作品集展示。

突出从传统行业进入AI数字化方向的成长过程。
`

          }


          ],



          temperature:
          0.3,


          max_tokens:
          2000


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
