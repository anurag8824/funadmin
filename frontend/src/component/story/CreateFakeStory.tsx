import React, { useEffect, useState } from "react";
import { Box, Modal, Typography } from "@mui/material";
import Selector from "../../extra/Selector";
import Input from "../../extra/Input";
import ReactSelect from "react-select";
import Button from "../../extra/Button";
import { useSelector } from "react-redux";
import { allUsers } from "../../store/userSlice";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { closeDialog } from "../../store/dialogSlice";
import { updateFakeVideo } from "../../store/videoSlice";
import { RootStore, useAppDispatch } from "@/store/store";

import {
  addFakePost,
  allHashTag,
  uploadMultipleFiles,
} from "@/store/postSlice";
import { projectName } from "@/util/config";
import hashTagIcon from "@/assets/images/HashtagIcon.png";
import { uploadFile } from "@/store/adminSlice";

import { allSong } from "@/store/songSlice";
import { addFakeStory, allStory, updateFakeStory } from "@/store/storySlice";

interface CreateFakeVideoProps {}

const style: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  backgroundColor: "background.paper",
  borderRadius: "5px",
  border: "1px solid #C9C9C9",
  boxShadow: "24px",
};

const CreateFakeStory: React.FC<CreateFakeVideoProps> = () => {
  const { dialogue, dialogueType, dialogueData } = useSelector(
    (state: any) => state.dialogue
  );

  

  const { fakeUserData } = useSelector((state: RootStore) => state.user);
  const { allSongData } = useSelector((state: RootStore) => state.song);
  const [mongoId, setMongoId] = useState<string>("");
  const [addVideoOpen, setAddVideoOpen] = useState<boolean>(false);
  const [fakeUserId, setFakeUserId] = useState<string>();
  const [fakePostDataGet, setFakeUserDataGet] = useState<any[]>([]);
  const [songData, setSongData] = useState<any[]>([]);
  const [songIds, setSongIds] = useState<any>("");
  const [storyType, setStoryType] = useState<any>(1);
  const [storyMediaType, setStoryMediaType] = useState<any>(1);
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [mediaFile, setMediaFile] = useState<any>("");
  const [error, setError] = useState({
    fakeUserId: "",
    songIds: "",
    storyType: "",
    storyMediaType: "",
    media: "",
  });

  const dispatch = useAppDispatch();
  useEffect(() => {
    setAddVideoOpen(dialogue);
    console.log("dialogueData-->", dialogueData);
    if (dialogueData) {
      setMongoId(dialogueData?._id);
      setMediaUrl(
        dialogueData?.storyType == 1
          ? dialogueData?.mediaImageUrl
          : dialogueData?.mediaVideoUrl
      );
      setFakeUserId(dialogueData?.userId?._id);
      setStoryType(dialogueData?.storyType);
      setStoryMediaType(dialogueData?.storyMediaType);
      setSongIds(dialogueData?.backgroundSong._id);
    }
  }, [dialogue, dialogueData]);
  useEffect(() => {
    const payload: any = {
      type: "fakeUser",
      start: 1,
      limit: 100,
      startDate: "All",
      endDate: "All",
    };
    dispatch(allUsers(payload));
  }, []);

  useEffect(() => {
    setFakeUserDataGet(fakeUserData);
  }, [fakeUserData]);
  useEffect(() => {
    setSongData(
      allSongData.map((item) => {
        return { _id: item._id, name: item.songTitle };
      })
    );
  }, [allSongData]);

  let folderStructure: string = `${projectName}/admin/videoUrl`;

  const handleFileUpload = async (image) => {

    const file = mediaFile;

    if(!(file instanceof File)) return;
    const formData = new FormData();

    formData.append("folderStructure", folderStructure);
    formData.append("keyName", file.name);
    formData.append("content", file);

    // Create a payload for your dispatch
    const payloadformData: any = {
      data: formData,
    };

    if (formData) {
      const response: any = await dispatch(
        uploadFile(payloadformData)
      ).unwrap();

      if (response?.data?.status) {
        if (response.data.url) {
          setMediaUrl(response.data.url);
          return response.data.url;
        }
      }
    }
  };

  const handleCloseAddCategory = () => {
    setAddVideoOpen(false);
    dispatch(closeDialog());
  };

  useEffect(() => {
    const payload: any = {};
    dispatch(allHashTag(payload));
    dispatch(
      allSong({
        start: 1,
        limit: 100,
        startDate: "All",
        endDate: "All",
      })
    );
  }, []);

  const handleSubmit = async () => {
    
    console.log("data==>", {
      fakeUserId,
      songIds,
      storyType,
      storyMediaType,
      mediaUrl,
      mediaFile,
    });
    if(!dialogueData && !fakeUserId) {
      setError({ ...error , fakeUserId : "User is required" })
    }
    if (
      !songIds || !storyType || !storyMediaType || !mediaUrl
    ) {
      let error: any = {};
      // if (!fakeUserId) error.fakeUserId = "User is required";
      if (!songIds) error.songIds = "Song is required";
      if (!storyType) error.storyType = "Story Type is required";
      if (!storyMediaType) error.storyMediaType = "Story Media Type is required";
      if (!mediaUrl) error.media = "Media URL is required";
      return setError({ ...error });
    } else {

    // console.log("storyMediaType-->" , storyMediaType);

    let payloadData: any = {
      userId: fakeUserId,
      storyType: storyType,
      backgroundSong: songIds,
      storyMediaType: storyMediaType,
    };

    if (storyMediaType == 2) {
      var imageUrl = await handleFileUpload(mediaFile);
    }

    if (storyType == 1) {
      payloadData.mediaImageUrl = storyMediaType == 2 ? imageUrl : mediaUrl;
    } else {
      payloadData.mediaVideoUrl = storyMediaType == 2 ? imageUrl : mediaUrl;
    }

    if (mongoId) {
      payloadData.storyId = mongoId;
      let payload: any = {
        data: payloadData,
        fakeUserId: dialogueData?.userId,
        id: mongoId,
      };
      dispatch(updateFakeStory(payload));
    } else {
      let payload: any = { data: payloadData, fakeUserId: fakeUserId };
      dispatch(addFakeStory(payload));
    }
    setTimeout(()=>{
      dispatch(closeDialog());
      const payload: any = {
        includeFake: true,
        start: 1,
        limit: 10,
        startDate: "All",
        endDate: "All",
      };
      dispatch(allStory(payload));
    }, 2000)
    }
  };

  return (
    <div>
      <Modal
        open={addVideoOpen}
        onClose={handleCloseAddCategory}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="">
          <div className="model-header">
            <p className="m-0">{dialogueData ? "Edit Story" : "Add Story"}</p>
          </div>

          <div className="model-body">
            <form>
              <div className="row sound-add-box videoCreateModel d-flex align-items-end">
                {!dialogueData && (
                  <div className="col-12 col-lg-6 col-sm-6 mt-2 country-dropdown ">
                    <Selector
                      label={"Fake User"}
                      selectValue={fakeUserId}
                      placeholder={"Enter Details..."}
                      selectData={fakePostDataGet}
                      selectId={true}
                      errorMessage={error.fakeUserId}
                      onChange={(e) => {
                        setFakeUserId(e.target.value);
                        if (!e.target.value) {
                          setError({
                            ...error,
                            fakeUserId: "Fake User Is Required",
                          });
                        } else {
                          setError({ ...error, fakeUserId: "" });
                        }
                      }}
                    />
                  </div>
                )}
                <div className="col-12 col-lg-6 col-sm-6 country-dropdown">
                  <Selector
                    label={"Select Song"}
                    selectValue={songIds}
                    placeholder={"Enter Details..."}
                    selectData={songData}
                    selectId={true}
                    errorMessage={error.songIds}
                    onChange={(e) => {
                      setSongIds(e.target.value);
                      if (!e.target.value) {
                        setError({
                          ...error,
                          songIds: "Fake User Is Required",
                        });
                      } else {
                        setError({ ...error, songIds: "" });
                      }
                    }}
                  />
                </div>

                <div className="col-lg-6 col-sm-12 custom-input mt-2">
                  <label >Story type</label>
                  <select
                    className="form-select"
                    name={"caption"}
                    value={storyType}
                    onChange={(e) => {
                      setStoryType(e.target.value);
                      if (!e.target.value) {
                        setError({
                          ...error,
                          storyType: "Caption Is Required",
                        });
                      } else {
                        setError({ ...error, storyType: "" });
                      }
                    }}
                  >
                    <option value="1">Image</option>
                    <option value="2">Video</option>
                  </select>
                  {error.storyType && (
                    <span className="text-danger">{error.storyType}</span>
                  )}
                </div>
                <div className="col-lg-6 col-sm-12 custom-input mt-2">
                  <label htmlFor="">Story Media type</label>
                  <select
                    className="form-select"
                    value={storyMediaType}
                    onChange={(e) => {
                      setStoryMediaType(e.target.value);
                      if (!e.target.value) {
                        setError({
                          ...error,
                          storyMediaType: "Caption Is Required",
                        });
                      } else {
                        setError({ ...error, storyMediaType: "" });
                      }
                    }}
                  >
                    <option value="2">File</option>
                    <option value="1">Link</option>
                  </select>
                  {error.storyType && (
                    <span className="text-danger">{error.storyType}</span>
                  )}
                </div>
                {storyMediaType == 1 ? (
                  <>
                    <div className="col-lg-12 col-sm-12 custom-input mt-2">
                      <label htmlFor="">Story Media Link</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={"Enter Details..."}
                        value={mediaUrl}
                        onChange={(e) => {
                          // setMediaFile(e.target.value);
                          setMediaUrl(e.target.value);
                          if (!e.target.value) {
                            setError({
                              ...error,
                              media: "Caption Is Required",
                            });
                          } else {
                            setError({ ...error, media: "" });
                          }
                        }}
                      />
                      {error.media && (
                        <span className="text-danger">{error.media}</span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-lg-12 col-sm-12 custom-input mt-2">
                      <label htmlFor="">Story Media</label>
                      <input
                        type="file"
                        className="form-control"
                        name={"caption"}
                        placeholder={"Enter Details..."}
                        onChange={(e) => {
                          setMediaFile(e.target.files[0]);
                          setMediaUrl(URL.createObjectURL(e.target.files[0]));
                          // if (!e.target.files[0]) {
                          //   setError({
                          //     ...error,
                          //     media: "Caption Is Required",
                          //   });
                          // } else {
                          //   setError({ ...error, media: "" });
                          // }
                        }}
                      />
                      {error.media && (
                        <span className="text-danger">{error.media}</span>
                      )}
                    </div>
                  </>
                )}

                <div className="col-lg-12 col-sm-12">
                  {mediaUrl &&
                    (storyType == 1 ? (
                      <>
                        <img
                          src={mediaUrl || ""}
                          style={{
                            width: "150px",
                            height: "150px",
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <video
                          controls
                          style={{ width: "150px", height: "150px" }}
                          src={mediaUrl || ""}
                        />
                      </>
                    ))}
                </div>
              </div>
            </form>
          </div>

          <div className="model-footer">
            <div className=" p-3 d-flex justify-content-end">
              <Button
                onClick={handleCloseAddCategory}
                btnName={"Close"}
                newClass={"close-model-btn"}
              />
              <Button
                onClick={handleSubmit}
                btnName={dialogueData ? "Update" : "Submit"}
                type={"button"}
                newClass={"submit-btn"}
                style={{
                  borderRadius: "0.5rem",
                  width: "88px",
                  marginLeft: "10px",
                }}
              />
            </div>
          </div>
        </Box>
      </Modal>
    </div>
  );
};
export default CreateFakeStory;
