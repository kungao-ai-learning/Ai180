import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sbcgcxljgceziohhytuw.supabase.co";
const supabaseKey = "sb_publishable_CSFpH1N5_WVloTnvNhArPQ_9Kh-JCuj";

const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

export default async function Home() {

  const { data: tasks } = await supabase
    .from("learning_tasks")
    .select("*")
    .order("day")
    .limit(7);


  return (
    <main style={{
      padding:"30px",
      fontFamily:"Arial"
    }}>

      <h1>
        Ai180 AI职业转型教练
      </h1>

      <h2>
        我的180天学习计划
      </h2>


      {
        tasks?.map((task)=>(
          <div
            key={task.day}
            style={{
              border:"1px solid #ddd",
              padding:"15px",
              margin:"15px 0",
              borderRadius:"10px"
            }}
          >

            <h3>
              Day {task.day}：
              {task.title}
            </h3>

            <p>
              {task.learn_content}
            </p >

          </div>
        ))
      }


    </main>
  );
}
