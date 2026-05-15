const { Octokit } = require("@octokit/rest");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).send("仅支持POST");
  }

  const { gameData, owner, repo, token } = req.body;

  const octokit = new Octokit({ auth: token });

  try {
    // 1. 读取现有 games.json
    const { data: file } = await octokit.rest.repos.getContent({
      owner, repo, path: "games.json"
    });

    // 2. 解码现有文件（强制用utf8，避免中文乱码）
    const existingContent = Buffer.from(file.content, "base64").toString("utf8");
    let games;
    try {
      games = JSON.parse(existingContent);
    } catch (parseErr) {
      games = []; // 如果现有文件损坏，重置为空数组，避免卡死
    }

    // 3. 追加新游戏
    games.push(gameData);

    // 4. 编码并提交（关键修复：用utf8处理所有内容）
    const newContent = JSON.stringify(games, null, 2);
    await octokit.rest.repos.createOrUpdateFileContents({
      owner, repo, path: "games.json",
      message: "添加新游戏",
      content: Buffer.from(newContent, "utf8").toString("base64"),
      sha: file.sha
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

