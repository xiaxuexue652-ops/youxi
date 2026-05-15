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

  const octokit = new Octokit({
    auth: token
  });

  try {
    // 读取现有 games.json
    const getFile = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: "games.json"
    });

    const content = Buffer.from(getFile.data.content, "base64").toString("utf8");
    let games = JSON.parse(content);

    // 追加新游戏
    games.push(gameData);

    // 重新写回文件，正确处理中文
    const newContent = JSON.stringify(games, null, 2);
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: "games.json",
      message: "自动添加新游戏",
      // 关键修复：用 Buffer.from 正确编码中文
      content: Buffer.from(newContent, "utf8").toString("base64"),
      sha: getFile.data.sha
    });

    res.status(200).json({ success: true, msg: "保存成功" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: err.message });
  }
};
