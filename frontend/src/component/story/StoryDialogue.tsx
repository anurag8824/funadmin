import { RootStore, useAppDispatch } from "@/store/store";
import { Box, Modal, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Button from "@/extra/Button";
import { closeDialog } from "@/store/dialogSlice";
import { baseURL } from "@/util/config";
import { getVideoDetails } from "@/store/videoSlice";
import HashtagaBanner from "../../assets/images/hashtagbanner.png";
import { getHashtag } from "@/store/hashTagSlice";
import ReactAudioPlayer from "react-audio-player";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  bgcolor: "background.paper",
  borderRadius: "5px",
  border: "1px solid #C9C9C9",
  boxShadow: 24,
  // p: "19px",
};
const StoryDialogue: React.FC = () => {
  const { dialogue, dialogueData } = useSelector(
    (state: RootStore) => state.dialogue
  );

  console.log("dialogueData-->", dialogueData);
  const { allHashTagData } = useSelector((state: RootStore) => state.hashTag);
  const dispatch = useAppDispatch();
  const [isExpanded, setIsExpanded] = useState(false);

  const [addPostOpen, setAddPostOpen] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const { videoData }: any = useSelector((state: RootStore) => state?.video);

  const getDataofHashtag = allHashTagData?.filter((hashTag: any) =>
    dialogueData?.hashTagId?.includes(hashTag?._id)
  );

  useEffect(() => {
    dispatch(getVideoDetails(dialogueData?._id));
    const payload = {
      start: 1,
      limit: 1000,
    };
    dispatch(getHashtag(payload));
  }, []);

  useEffect(() => {
    setAddPostOpen(dialogue);
  }, [dialogue]);

  const handleCloseAddCategory = () => {
    setAddPostOpen(false);
    dispatch(closeDialog());
  };

  const toggleReadMore = () => {
    setIsExpanded(!isExpanded);
  };

  const maxLength = 10; // Number of characters to show initially
  const caption = dialogueData?.caption || "";

  return (
    <div>
      <Modal
        open={addPostOpen}
        onClose={handleCloseAddCategory}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="">
          {/* <Box sx={style} className="create-channel-model"> */}

          <div className="model-header">
            <p className="m-0">Story Info</p>
          </div>

          <div className="model-body">
            <p className="fs-6 fw-medium m-0">Content</p>
            <div className="row justify-content-center">
              <div className="col-12 d-flex justify-content-center w-100 ">
                {dialogueData?.storyType == 1 ? (
                  <>
                    <img
                      src={dialogueData?.mediaImageUrl}
                      alt=""
                      height={300}
                      width={300}
                      className="rounded-4 border border-2 object-cover"
                    />
                  </>
                ) : (
                  <>
                    <video
                      className="border border-2 rounded-4"
                      controls
                      src={dialogueData?.mediaVideoUrl}
                      height={300}
                      width={300}
                      // style={{ objectFit: "contain", width: "full" }}
                    />
                  </>
                )}
              </div>
              {dialogueData?.backgroundSong?.songTitle && (
                <>
                  {/* <div className="col-12 mt-3">
                    <span className="fw-bold images-class">Song Details</span>
                    <div className="row align-items-center">
                      <div className="col-2">
                      <img src={dialogueData?.backgroundSong?.songImage} className="rounded-1" width={"50px"} height={"50px"}  />
                      </div>
                      <div className=" row col-10">

                      <div className="col-6 mb-2">
                        <Typography
                          variant="body1"
                          className="mt-1"
                          style={{
                            fontSize: "14px",
                            color: "#000",
                            fontWeight: "500",
                          }}
                        >
                          Title :{" "}
                          {dialogueData?.backgroundSong?.songTitle || "-"}
                        </Typography>
                      </div>
                      <div className="col-6 mb-2">
                        <Typography
                          variant="body1"
                          className="mt-1"
                          style={{
                            fontSize: "14px",
                            color: "#000",
                            fontWeight: "500",
                          }}
                        >
                          Singer :{" "}
                          {dialogueData?.backgroundSong?.singerName || "-"}
                        </Typography>
                      </div>
                      <div className="col-6 mb-2">
                        <Typography
                          variant="body1"
                          className="mt-1"
                          style={{
                            fontSize: "14px",
                            color: "#000",
                            fontWeight: "500",
                          }}
                        >
                          Song Time :{" "}
                          {dialogueData?.backgroundSong?.songTime || "-"}
                        </Typography>
                      </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <ReactAudioPlayer
                        src={dialogueData?.backgroundSong?.songLink}
                        controls
                        muted
                        onPlay={() => console.log("Audio is playing")}
                        onError={(error) =>
                          console.error("Audio error:", error)
                        }
                        className="w-100"
                      />
                    </div>
                  </div> */}
                  <p className="fs-6 fw-medium m-0 mt-4">Song Details</p>
                  <div className="card mb-3 mt-2 " style={{ maxWidth: 569 }}>
                    <div className="row g-0 ">
                      <div className="col-md-4">
                        <img
                          src={dialogueData?.backgroundSong?.songImage}
                          className=" rounded-start"
                          alt="..."
                          height={190}
                          width={190}
                        />
                      </div>
                      <div className="col-md-8">
                        <div className="card-body d-flex flex-column h-100 justify-content-between">
                          <h5 className="card-title">
                            {dialogueData?.backgroundSong?.songTitle}
                          </h5>
                          <p className="card-text m-0">
                            Singer:{" "}
                            {dialogueData?.backgroundSong?.singerName || "-"}
                          </p>
                          <p className="card-text m-0">
                            Duration:{" "}
                            {dialogueData?.backgroundSong?.songTime || "-"}
                          </p>
                          <ReactAudioPlayer
                            src={dialogueData?.backgroundSong?.songLink}
                            controls
                            muted
                            onPlay={() => console.log("Audio is playing")}
                            onError={(error) =>
                              console.error("Audio error:", error)
                            }
                            className="w-100"
                            style={{
                              height: "50px",
                              backgroundColor: "#f0f0f0",
                              borderRadius: "5px",
                            }}
                          />

                          {/* <p className="card-text m-0">
                            <small className="text-body-secondary">
                              Last updated 3 mins ago
                            </small>
                          </p> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="model-footer">
            <div className="p-3 d-flex justify-content-end">
              <Button
                onClick={handleCloseAddCategory}
                btnName={"Close"}
                newClass={"close-model-btn"}
              />
            </div>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default StoryDialogue;
