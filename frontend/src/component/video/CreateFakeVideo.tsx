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
import { addFakeVideo, updateFakeVideo } from "../../store/videoSlice";
import { RootStore, useAppDispatch } from "@/store/store";

import { allHashTag, uploadMultipleFiles } from "@/store/postSlice";
import { projectName } from "@/util/config";
import hashTagIcon from "@/assets/images/HashtagIcon.png";
import { uploadFile } from "@/store/adminSlice";


interface CreateFakeVideoProps { }

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

const CreateFakeVideo: React.FC<CreateFakeVideoProps> = () => {
  const { dialogue, dialogueType, dialogueData } = useSelector(
    (state: any) => state.dialogue
  );

  

  const { fakeUserData } = useSelector((state: RootStore) => state.user);
  const { allHashTagData } = useSelector((state: RootStore) => state.post);
  const [mongoId, setMongoId] = useState<string>("");
  const [addVideoOpen, setAddVideoOpen] = useState<boolean>(false);
  const [caption, setCaption] = useState<string>("");
  const [fakeUserId, setFakeUserId] = useState<string>();
  const [videoTime, setVideoTime] = useState<number>();
  const [fakePostDataGet, setFakeUserDataGet] = useState<any[]>([]);
  const [oldData, setOldData] = useState<any>([]);
  const [video, setVideo] = useState<{
    file: string;
    thumbnailBlob: File | null;
  }>({
    file: null,
    thumbnailBlob: null,
  });
  const [selectedHashtag, setSelectedHashtag] = useState<any>();
  const [selectedHashTagId, setSelectedHashTagId] = useState<any>([]);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<any>();
  const [thumbnailKey, setThumbnailKey] = useState<number>(0);
  const [fileData, setFileData] = useState<File | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [error, setError] = useState({
    caption: "",
    video: "",
    fakeUserId: "",
    hashTag: "",
    country: "",
  });

  const dispatch = useAppDispatch();
  useEffect(() => {
    setAddVideoOpen(dialogue);
    if (dialogueData) {
      setMongoId(dialogueData?._id);
      setCaption(dialogueData?.caption || "");
      setFakeUserId(dialogueData?.userId || "");
      setVideoPath(dialogueData?.videoUrl || null);
      setThumbnail(dialogueData?.videoImage || []);
      setVideoTime(dialogueData?.videoTime || 0);
      setSelectedHashtag(dialogueData?.hashTags);
      setOldData(dialogueData);
      setPreviewVideoUrl(dialogueData?.videoUrl || null);
      setPreviewImageUrl(dialogueData?.videoImage || null);
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

  let folderStructure: string = `${projectName}/admin/videoUrl`;

  const getVideoUrl: any = async (file, thumbnailFile) => {
    const formData = new FormData();

    formData.append("folderStructure", folderStructure);
    formData.append("keyName", file.name);
    formData.append("content", file);

    const payloadformData: any = {
      data: formData,
    };

    if (formData) {
      const response: any = await dispatch(
        uploadFile(payloadformData)
      ).unwrap();

      if (response?.data?.status) {
        if (response.data.url) {
          setVideo({
            file: response.data.url,
            thumbnailBlob: thumbnailFile,
          });
          setVideoPath(response.data.url);
        }
      }
    }
  };

  let folderStructureThubnailImage: string = `${projectName}/admin/videoImage`;

  const handleVideo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError((prev) => ({ ...prev, video: "Please select a video!" }));
      return;
    }
    setFileData(file);
    try {
      const videoURL = URL.createObjectURL(file);
      setPreviewVideoUrl(videoURL);

      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = videoURL;

      video.onloadedmetadata = () => {
        setVideoTime(video.duration);
        video.currentTime = 1;
      };

      video.onseeked = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              setThumbnailBlob(blob);
              setPreviewImageUrl(URL.createObjectURL(blob));
              setError((prev) => ({ ...prev, video: "" }));
            }
          }, "image/jpeg");
        }
      };

      video.onerror = () => {
        setError((prev) => ({ ...prev, video: "Error loading video. Please try a different format." }));
        URL.revokeObjectURL(videoURL);
      };
    } catch (error) {
      console.error("Error processing video file:", error);
      setError((prev) => ({ ...prev, video: "Error processing video file. Please try again." }));
    }
  };

  const handleVideoUpload = async () => {
    if (!fileData && dialogueData?.videoUrl && dialogueData?.videoImage) {
      return {
        videoUrl: dialogueData.videoUrl,
        videoImage: dialogueData.videoImage
      };
    }

    if (!fileData) {
      setError((prev) => ({ ...prev, video: "Please select a valid video file!" }));
      return null;
    }

    try {
      const formData: any = new FormData();
      formData.append("folderStructure", `${projectName}/admin/videoUrl`);
      formData.append("keyName", fileData.name);
      formData.append("content", fileData);

      let thumbnailBlob = null;
      try {
        thumbnailBlob = await generateThumbnailBlob(fileData);
      } catch (thumbnailError) {
        console.error("Thumbnail generation failed:", thumbnailError);
        setError((prev) => ({ ...prev, video: "Failed to generate thumbnail." }));
        return null;
      }

      if (thumbnailBlob) {
        const thumbnailFileName = `${fileData.name.replace(/\.[^/.]+$/, "")}.jpeg`;
        const thumbnailFile = new File([thumbnailBlob], thumbnailFileName, { type: "image/jpeg" });
        formData.append("content", thumbnailFile);
      }

      const payload: any = {
        data: formData
      }
      const response: any = await dispatch(uploadMultipleFiles(payload)).unwrap();

      if (response?.data?.status) {
        return {
          videoUrl: response.data.urls[0],
          videoImage: response.data.urls[1],
        };
      } else {
        throw new Error("Upload failed: Invalid response from server.");
      }
    } catch (error) {
      console.error("File upload failed:", error);
      setError((prev) => ({ ...prev, video: "Failed to upload video. Please try again." }));
      return null;
    }
  };

  const generateThumbnailBlob = async (file: File) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        video.currentTime = 1; // Set to capture the frame at 1 second
      };

      video.onseeked = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert the canvas to blob
        canvas.toBlob((blob) => {
          resolve(blob);
        }, "image/jpeg");
      };

      const objectURL = URL.createObjectURL(file);
      video.src = objectURL;

      return () => {
        URL.revokeObjectURL(objectURL);
      };
    });
  };

  const handleCloseAddCategory = () => {
    setAddVideoOpen(false);
    dispatch(closeDialog());
  };

  const handleSelectChangeHashTag = (selected: any | null) => {
    setSelectedHashtag(selected || []);
    const selectedIds = selected?.map((option: any) => option?._id);
    const updatedData = selectedIds?.join(",");
    setSelectedHashTagId(updatedData);
    if (!selected) {
      return setError({
        ...error,
        hashTag: `HashTag Is Required`,
      });
    } else {
      return setError({
        ...error,
        hashTag: "",
      });
    }
  };

  const handleRemoveApp = (removedOption: any) => {
    const updatedOptions = selectedHashtag?.filter(
      (option: any) => option._id !== removedOption?._id
    );
    setSelectedHashtag(updatedOptions);
    const selectedIds = updatedOptions?.map((option: any) => option?._id);
    const updatedData = selectedIds?.join(",");
    setSelectedHashTagId(updatedData);
  };

  useEffect(() => {
    const payload: any = {};
    dispatch(allHashTag(payload));
  }, []);

  const CustomOptionHashTag: React.FC<{
    innerProps: any;
    label: string;
    data: any;
  }> = ({ innerProps, data }) => (
    <div
      {...innerProps}
      className="country-optionList"
      style={{ height: "40px" }}
    >
      {data?.hashTagBanner && data?.hashTagBanner !== "" ? (
        <img
          src={data?.hashTagBanner}
          onError={(e) => {
            const target: any = e.target as HTMLImageElement;
            target.src = hashTagIcon;
          }}
          alt="hashTagBanner"
          height={25}
          width={25}
          style={{ objectFit: "cover" }}
        />
      ) : (
        <img
          src={hashTagIcon.src}
          alt="hashTagBanner"
          height={25}
          width={25}
          style={{ objectFit: "cover" }}
        />
      )}
      <span>{data?.hashTag && data?.hashTag}</span>
    </div>
  );

  const CustomMultiValueHashTag: React.FC<{
    children: React.ReactNode;
    data: any;
  }> = ({ children, data }) => (
    <div className="custom-multi-value">
      {children}
      <span
        className="custom-multi-value-remove"
        onClick={() => handleRemoveApp(data)}
      >
        <HighlightOffIcon />
      </span>
    </div>
  );

  const handleSubmit = async () => {
    
    if (
      !caption ||
      !fakeUserId ||
      !previewVideoUrl ||
      selectedHashtag?.length === 0
    ) {
      let error: any = {};
      if (!caption) error.caption = "Caption Is Required !";
      if (!fakeUserId) error.fakeUserId = "User Is Required !";
      if (!previewVideoUrl) error.video = "Please select video!";
      if (selectedHashTagId?.length === 0)
        error.hashTag = "Please select hashTag!";
      return setError({ ...error });
    } else {

      const uploadResult = await handleVideoUpload();

      let payloadData: any = {
        caption: caption,
        videoUrl: uploadResult?.videoUrl,
        videoTime: videoTime?.toString() || "",
        hashTagId: selectedHashTagId,
      };

      if (mongoId) {
          payloadData.videoImage = uploadResult?.videoImage;

        let payload: any = {
          data: payloadData,
          fakeUserId:
            typeof dialogueData?.userId === "string"
              ? dialogueData?.userId
              : dialogueData?.userId?._id,
          id: mongoId,
        };
        dispatch(updateFakeVideo(payload));
      } else {
        payloadData.videoImage = uploadResult?.videoImage;
        let payload: any = { data: payloadData, fakeUserId: fakeUserId };
        dispatch(addFakeVideo(payload));
      }
      dispatch(closeDialog());
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
              <p className="m-0">
               {dialogueData ? "Edit Video" : "Add Video"}
            </p>
            </div>

             <div className="model-body">
          <form>
            <div className="row sound-add-box videoCreateModel d-flex align-items-end">
              {!dialogueData && (
                <div className="col-12 col-lg-6 col-sm-6 mt-2 country-dropdown">
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
              <div className="col-lg-6 col-sm-12">
                <Input
                  label={"Caption"}
                  name={"caption"}
                  placeholder={"Enter Details..."}
                  value={caption}
                  errorMessage={error.caption}
                  onChange={(e) => {
                    setCaption(e.target.value);
                    if (!e.target.value) {
                      setError({ ...error, caption: "Caption Is Required" });
                    } else {
                      setError({ ...error, caption: "" });
                    }
                  }}
                />
              </div>

              <div className="col-12 col-lg-6 col-sm-6 mt-2">
                <Input
                  label={"Video Time (Seconds)"}
                  name={"videoTime"}
                  accept={"video/*"}
                  placeholder={"Video Time"}
                  value={videoTime?.toFixed(2) || ""}
                  disabled={true}
                />
              </div>

              {dialogueType && dialogueType === "fakeVideo" && (
                <div className="col-12 mt-3 country-dropdown">
                  <label>HashTag</label>
                  <ReactSelect
                    isMulti
                    options={allHashTagData || []}
                    value={selectedHashtag}
                    isClearable={false}
                    isDisabled={dialogueData ? true : false}
                    onChange={(selected) => handleSelectChangeHashTag(selected)}
                    getOptionValue={(option) => option?._id}
                    formatOptionLabel={(option) => (
                      <div
                        className="optionShow-option"
                        style={{ display: "flex", alignItems: "center" }}
                      >
                        {option?.hashTagBanner &&
                          option?.hashTagBanner !== "" && (
                            <img
                              src={option?.hashTagBanner}
                              height={25}
                              width={25}
                              alt="Banner"
                              onError={(e) => {
                                const target: any =
                                  e.target as HTMLImageElement;
                                target.src = hashTagIcon;
                              }}
                            />
                          )}

                        <span>{option?.hashTag ? option?.hashTag : ""}</span>
                      </div>
                    )}
                    components={{
                      Option: CustomOptionHashTag,
                      MultiValue: CustomMultiValueHashTag,
                    }}
                  // let    isDisabled = !!dialogueData // Disable when editing
                  />
                  {error.hashTag && (
                    <p className="errorMessage">
                      {error.hashTag && error.hashTag}
                    </p>
                  )}
                </div>
              )}

              <div className="col-12 mt-2">
                <Input
                  label={`Video`}
                  id={`video`}
                  type={`file`}
                  accept={`video/*`}
                  errorMessage={error.video}
                  onChange={handleVideo}
                />
              </div>

              {previewVideoUrl ? (
                <div className="col-12 d-flex mt-4 videoShow">
                  <video
                    controls
                    style={{ width: "150px", height: "150px" }}
                    src={previewVideoUrl ? previewVideoUrl : ""}
                  />
                  <img
                    src={previewImageUrl ? previewImageUrl : ""}
                    style={{
                      width: "150px",
                      height: "150px",
                      marginLeft: "20px",
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="col-12 d-flex mt-4">
                    <video
                      controls
                      style={{ width: "200px", height: "200px" }}
                      src={videoPath}
                    />
                  </div>
                </>
              )}
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
export default CreateFakeVideo;
