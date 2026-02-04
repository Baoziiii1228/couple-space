import { drizzle } from "drizzle-orm/mysql2";
import dotenv from "dotenv";

dotenv.config();

const quotes = [
  { content: "我爱你，不是因为你是谁，而是因为和你在一起时，我是谁。", author: "罗伊·克里夫特" },
  { content: "世界上最美好的事情，就是每天醒来，第一个想到的人是你。", author: null },
  { content: "遇见你之前，我没有想过结婚；遇见你之后，我没有想过别人。", author: null },
  { content: "我想和你一起慢慢变老，直到老得哪儿也去不了，你还依然把我当成手心里的宝。", author: null },
  { content: "你是我的今天，以及所有的明天。", author: "利奥·克里斯托弗" },
  { content: "我喜欢你，像风走了八千里，不问归期。", author: null },
  { content: "愿得一人心，白首不相离。", author: "卓文君" },
  { content: "你若不离不弃，我必生死相依。", author: null },
  { content: "我想把世界上最好的都给你，却发现世界上最好的就是你。", author: null },
  { content: "从前的日色变得慢，车，马，邮件都慢，一生只够爱一个人。", author: "木心" },
  { content: "我这一生遇到过很多人，他们如同指间的烟火，忽明忽暗，最后只沦为一抹灰烬；而你不同，你如北斗，闪耀在我的整个人生。", author: null },
  { content: "我爱你，没有什么目的。只是爱你。", author: "三毛" },
  { content: "你是我温暖的手套，冰冷的啤酒，带着阳光味道的衬衫，日复一日的梦想。", author: null },
  { content: "我想和你虚度时光，比如低头看鱼，比如把茶杯留在桌子上，离开，浪费它们好看的阴影。", author: "李元胜" },
  { content: "你是我患得患失的梦，我是你可有可无的人。", author: null },
  { content: "我不知道什么叫年少轻狂，我只知道胜者为王。", author: null },
  { content: "喜欢你，是一件很幸福的事。", author: null },
  { content: "你笑起来真好看，像春天的花一样。", author: null },
  { content: "我希望有个如你一般的人，如山间清爽的风，如古城温暖的光。", author: "张嘉佳" },
  { content: "我想你，在每一个没有你的夜里。", author: null },
  { content: "你是我见过最美丽的风景。", author: null },
  { content: "爱情不是寻找共同点，而是学会尊重不同点。", author: null },
  { content: "我爱你，从这里到月亮，再绕回来。", author: "山姆·麦克布雷尼" },
  { content: "你是我的例外，也是我的偏爱。", author: null },
  { content: "我想和你一起生活，在某个小镇，共享无尽的黄昏和绵绵不绝的钟声。", author: "茨维塔耶娃" },
  { content: "你的名字是我听过最美的情话。", author: null },
  { content: "我喜欢你，胜于昨日，略匮明朝。", author: null },
  { content: "世间五味俱全，谢谢你给我的甜。", author: null },
  { content: "我想陪你看日出日落，想陪你走过春夏秋冬。", author: null },
  { content: "你是我的北极星，指引我前进的方向。", author: null },
];

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log("Seeding daily quotes...");

  for (const quote of quotes) {
    await db.execute({
      sql: "INSERT INTO dailyQuotes (content, author) VALUES (?, ?)",
      args: [quote.content, quote.author],
    });
  }

  console.log(`Seeded ${quotes.length} quotes successfully!`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
