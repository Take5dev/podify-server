import Audio from "@/models/audio";
import AutoPlaylist from "@/models/autoPlaylist";
import cron from "node-cron";

const generatePlaylist = async () => {
  const audios = await Audio.aggregate([
    { $sort: { likes: -1 } },
    { $sample: { size: 20 } },
    { $group: { _id: "$category", audios: { $push: "$$ROOT._id" } } },
  ]);

  audios.map(async (audio) => {
    await AutoPlaylist.updateOne(
      { title: audio._id },
      { $set: { items: audio.audios } },
      { upsert: true }
    );
  });
};

cron.schedule("0 31 1 * * *", async () => {
  await generatePlaylist();
  console.log("Playlists generated");
});
