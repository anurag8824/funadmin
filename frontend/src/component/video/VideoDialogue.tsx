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
const VideoDialogue: React.FC = () => {
  const { dialogue, dialogueData } = useSelector(
    (state: RootStore) => state.dialogue
  );
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
            <p className="m-0">Video Info</p>
          </div>

          <div className="model-body">
            <div className="row mt-3 ">
              {dialogueData?.liveStreamMode == 2 ? (
                <>
                  {dialogueData.pkMediaSources.map((item , i) => {
                    return (
                      <>
                      {/* <span>Video {i + 1 }</span> */}
                      <video
                      className="w-50"
                        controls
                        src={item}
                        width={250}
                        height={250}
                        style={{ objectFit: "contain", width: "full" }}
                      />
                      </>
                    );
                  })}
                </>
              ) : (
                <>
                  <video
                    controls
                    src={dialogueData?.videoUrl}
                    width={0}
                    height={350}
                    style={{ objectFit: "contain", width: "full" }}
                  />
                </>
              )}
            </div>
            <div className="col-12 mt-3">
              <span className="fw-bold images-class">
                {caption ? "Caption:" : ""}
              </span>
              <Typography
                variant="body1"
                style={{
                  fontSize: "14px",
                  color: "#000",
                  marginLeft: "10px",
                  fontWeight: "500",
                  marginTop: "15px",
                }}
              >
                {dialogueData?.caption?.length > 50 ? (
                  <div>
                    {showFullCaption
                      ? dialogueData?.caption
                      : dialogueData?.caption.slice(0, 50) + "... "}
                    {!showFullCaption && (
                      <span
                        onClick={() => setShowFullCaption(true)}
                        style={{
                          color: "#1F3C88",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        Read More
                      </span>
                    )}
                  </div>
                ) : (
                  dialogueData?.caption // Show the full caption directly if it's ≤ 50 characters
                )}
              </Typography>
            </div>
            {/* Hashtags Section */}
            {dialogueData?.hashTags?.length > 0 && (
              <h6 className="mt-2 images-class">Hashtag :</h6>
            )}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginTop: "15px",
              }}
            >
              {dialogueData?.hashTags?.map((tag, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "5px 12px 0px 0px",
                    borderRadius: "15px",
                    fontSize: "14px",
                    color: "#333",
                  }}
                >
                  <img
                    src={tag.hashTagBanner}
                    alt={tag.name}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "5px",
                      marginRight: "5px",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      const target: any = e.target as HTMLImageElement;
                      target.src = HashtagaBanner.src;
                    }}
                  />
                  <b
                    className="text-dark"
                    style={{
                      fontSize: "14px",
                    }}
                  >
                    #{tag.hashTag}
                  </b>
                </div>
              ))}
            </div>

            {getDataofHashtag?.length > 0 && (
              <h6 className="mt-2 images-class">Hashtag :</h6>
            )}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginTop: "15px",
              }}
            >
              {getDataofHashtag?.map((tag, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "5px 12px 0px 0px",
                    borderRadius: "15px",
                    fontSize: "14px",
                    color: "#333",
                  }}
                >
                  <img
                    src={tag.hashTagBanner}
                    alt={tag.name}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "5px",
                      marginRight: "5px",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      const target: any = e.target as HTMLImageElement;
                      target.src = HashtagaBanner.src;
                    }}
                  />
                  <b
                    className="text-dark"
                    style={{
                      fontSize: "14px",
                    }}
                  >
                    #{tag.hashTag}
                  </b>
                </div>
              ))}
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

export default VideoDialogue;
