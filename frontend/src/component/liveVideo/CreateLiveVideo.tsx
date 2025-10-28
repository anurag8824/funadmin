import React, { useEffect, useState } from "react";
import { Box, Modal, Typography } from "@mui/material";
import Selector from "../../extra/Selector";
import Input from "../../extra/Input";
import Button from "../../extra/Button";
import { useSelector } from "react-redux";
import { allUsers } from "../../store/userSlice";
import { closeDialog } from "../../store/dialogSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { projectName } from "@/util/config";
import { addLiveVideo, updateLiveVideo } from "@/store/liveVideoSlice";
import Image from "next/image";
import { uploadMultipleFiles, uploadFile } from "@/store/postSlice";


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

const CreateLiveVideo: React.FC<CreateFakeVideoProps> = () => {
  const { dialogue, dialogueType, dialogueData } = useSelector(
    (state: any) => state.dialogue
  );

  const { fakeUserData } = useSelector((state: RootStore) => state.user);
  const [mongoId, setMongoId] = useState<string>("");
  const [addVideoOpen, setAddVideoOpen] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>();
  const [videoTime, setVideoTime] = useState<number>();
  const [fakePostDataGet, setFakeUserDataGet] = useState<any[]>([]);
  
  // Video file states
  const [fileData, setFileData] = useState<File | null>(null);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<any>("");
  const [isVideoChanged, setIsVideoChanged] = useState<boolean>(false);
  
  // Thumbnail file states
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [videoThumbUrl, setVideoThumbUrl] = useState<any>("");
  const [isThumbnailChanged, setIsThumbnailChanged] = useState<boolean>(false);
  
  // Configuration states
  const [mediaSourceKind, setMediaSourceKind] = useState<any>(2);
  const [thumbnailType, setthumbnailType] = useState<any>(2);

  // Track individual field changes
  const [changedFields, setChangedFields] = useState<{
    userId: boolean;
    mediaSourceKind: boolean;
    thumbnailType: boolean;
    videoUrl: boolean;
    videoImage: boolean;
    videoTime: boolean;
    liveStreamMode: boolean;
  }>({
    userId: false,
    mediaSourceKind: false,
    thumbnailType: false,
    videoUrl: false,
    videoImage: false,
    videoTime: false,
    liveStreamMode: false,
  });

  // Store original values for comparison
  const [originalValues, setOriginalValues] = useState<any>({});

  const [error, setError] = useState({
    video: "",
    userId: "",
    country: "",
    mediaSourceKind: "",
    videoUrlError: "",
    thumbnailurlError: "",
    thumbnailType: "",
  });

  

  const dispatch = useAppDispatch();

  // Helper function to mark field as changed
  const markFieldChanged = (fieldName: keyof typeof changedFields, isChanged: boolean = true) => {
    setChangedFields(prev => ({
      ...prev,
      [fieldName]: isChanged
    }));
  };

  useEffect(() => {
    setAddVideoOpen(dialogue);
    if (dialogueData) {
      console.log("dialogueData?.mediaSourceKind-->", dialogueData?.mediaSourceKind);
      
      // Store original values
      const original = {
        userId: dialogueData?.userId || "",
        mediaSourceKind: dialogueData?.mediaSourceKind || 1,
        thumbnailType: dialogueData?.thumbnailType || 1,
        videoUrl: dialogueData?.videoUrl || "",
        videoImage: dialogueData?.videoImage || "",
        videoTime: dialogueData?.videoTime || 0,
        liveStreamMode: 1
      };
      setOriginalValues(original);

      // Set current values
      setMongoId(dialogueData?._id);
      setUserId(dialogueData?.userId || "");
      setVideoPath(dialogueData?.videoUrl || null);
      setVideoTime(dialogueData?.videoTime || 0);
      setPreviewVideoUrl(dialogueData?.videoUrl || null);
      setPreviewImageUrl(dialogueData?.videoImage || null);
      setMediaSourceKind(dialogueData?.mediaSourceKind || 1);
      setVideoUrl(dialogueData?.videoUrl || "");
      setVideoThumbUrl(dialogueData?.videoImage || "");
      setthumbnailType(dialogueData?.thumbnailType || 1);
      
      // Reset file change flags when editing existing data
      setIsVideoChanged(false);
      setIsThumbnailChanged(false);
      setFileData(null);
      setThumbnail(null);

      // Reset changed fields tracker
      setChangedFields({
        userId: false,
        mediaSourceKind: false,
        thumbnailType: false,
        videoUrl: false,
        videoImage: false,
        videoTime: false,
        liveStreamMode: false,
      });
    } else {
      // Reset all states for new video creation
      setOriginalValues({});
      setMongoId("");
      setUserId("");
      setVideoPath(null);
      setVideoTime(0);
      setPreviewVideoUrl(null);
      setPreviewImageUrl(null);
      setMediaSourceKind(2);
      setVideoUrl("");
      setVideoThumbUrl("");
      setthumbnailType(2);
      setIsVideoChanged(false);
      setIsThumbnailChanged(false);
      setFileData(null);
      setThumbnail(null);
      setChangedFields({
        userId: false,
        mediaSourceKind: false,
        thumbnailType: false,
        videoUrl: false,
        videoImage: false,
        videoTime: false,
        liveStreamMode: false,
      });
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

  const uploadSingleFile = async (file: File, folderPath: string): Promise<string | null> => {
    try {
      const newFileName = `custom_name_${Date.now()}.${file.name.split(".").pop()}`;
      const renamedFile = new File([file], newFileName, { type: file.type });

      const formData = new FormData();
      formData.append("folderStructure", folderPath);
      formData.append("keyName", file.name);
      formData.append("content", renamedFile);

      const payload = { data: formData };
      const response: any = await dispatch(uploadFile(payload)).unwrap();

      if (response?.data?.status) {
        return response.data.url;
      } else {
        throw new Error("Upload failed: Invalid response from server.");
      }
    } catch (error) {
      console.error("Single file upload failed:", error);
      throw error;
    }
  };

  const uploadMultipleFilesHandler = async (videoFile: File, thumbnailFile: File): Promise<{ videoUrl: string; videoImage: string } | null> => {
    try {
      const newVideoFileName = `custom_name_${Date.now()}.${videoFile.name.split(".").pop()}`;
      const renamedVideoFile = new File([videoFile], newVideoFileName, { type: videoFile.type });

      const newThumbnailFileName = `custom_name_${Date.now()}.${thumbnailFile.name.split(".").pop()}`;
      const renamedThumbnailFile = new File([thumbnailFile], newThumbnailFileName, { type: thumbnailFile.type });

      const formData = new FormData();
      formData.append("folderStructure", `${projectName}/admin/livevideoImage`);
      formData.append("keyName", videoFile.name);
      formData.append("content", renamedVideoFile);
      formData.append("content", renamedThumbnailFile);

      const payload = { data: formData };
      const response: any = await dispatch(uploadMultipleFiles(payload)).unwrap();

      if (response?.data?.status && response.data.urls?.length >= 2) {
        return {
          videoUrl: response.data.urls[0],
          videoImage: response.data.urls[1],
        };
      } else {
        throw new Error("Upload failed: Invalid response from server.");
      }
    } catch (error) {
      console.error("Multiple files upload failed:", error);
      throw error;
    }
  };

  const handleFileUploads = async (): Promise<{ videoUrl: string; videoImage: string } | null> => {
    try {
      let finalVideoUrl = dialogueData?.videoUrl || videoUrl;
      let finalVideoImage = dialogueData?.videoImage || videoThumbUrl;

      // Determine what needs to be uploaded
      const needsVideoUpload = mediaSourceKind === 2 && isVideoChanged && fileData;
      const needsThumbnailUpload = thumbnailType === 2 && isThumbnailChanged && thumbnail;

      if (needsVideoUpload && needsThumbnailUpload) {
        // Case 1: Both video and thumbnail need to be uploaded
        console.log("Uploading both video and thumbnail...");
        const result = await uploadMultipleFilesHandler(fileData!, thumbnail!);
        if (result) {
          finalVideoUrl = result.videoUrl;
          finalVideoImage = result.videoImage;
          markFieldChanged('videoUrl');
          markFieldChanged('videoImage');
        }
      } else if (needsVideoUpload) {
        // Case 2: Only video needs to be uploaded
        console.log("Uploading video only...");
        const videoUploadResult = await uploadSingleFile(fileData!, `${projectName}/admin/livevideoImage`);
        if (videoUploadResult) {
          finalVideoUrl = videoUploadResult;
          markFieldChanged('videoUrl');
        }
      } else if (needsThumbnailUpload) {
        // Case 3: Only thumbnail needs to be uploaded
        console.log("Uploading thumbnail only...");
        const thumbnailUploadResult = await uploadSingleFile(thumbnail!, `${projectName}/admin/livevideoImage`);
        if (thumbnailUploadResult) {
          finalVideoImage = thumbnailUploadResult;
          markFieldChanged('videoImage');
        }
      }

      // For link-based media, use the URL inputs
      if (mediaSourceKind === 1) {
        finalVideoUrl = videoUrl;
      }
      if (thumbnailType === 1) {
        finalVideoImage = videoThumbUrl;
      }

      return {
        videoUrl: finalVideoUrl,
        videoImage: finalVideoImage,
      };
    } catch (error) {
      console.error("File upload process failed:", error);
      setError((prev) => ({
        ...prev,
        video: "Failed to upload files. Please try again.",
      }));
      return null;
    }
  };

  const handleVideo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError((prev) => ({ ...prev, video: "Please select a video!" }));
      return;
    }

    setFileData(file);
    setIsVideoChanged(true);
    markFieldChanged('videoUrl'); // Mark video field as changed

    try {
      const videoURL = URL.createObjectURL(file);
      setPreviewVideoUrl(videoURL);

      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = videoURL;

      video.onloadedmetadata = () => {
        const newVideoTime = video.duration;
        if (newVideoTime !== originalValues.videoTime) {
          setVideoTime(newVideoTime);
          markFieldChanged('videoTime');
        }
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
              setError((prev) => ({ ...prev, video: "" }));
            }
          }, "image/jpeg");
        }
      };

      video.onerror = () => {
        setError((prev) => ({
          ...prev,
          video: "Error loading video. Please try a different format.",
        }));
        URL.revokeObjectURL(videoURL);
      };
    } catch (error) {
      console.error("Error processing video file:", error);
      setError((prev) => ({
        ...prev,
        video: "Error processing video file. Please try again.",
      }));
    }
  };

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError((prev) => ({ ...prev, thumbnailurlError: "Please select a thumbnail!" }));
      return;
    }

    setThumbnail(file);
    setIsThumbnailChanged(true);
    setVideoThumbUrl(URL.createObjectURL(file));
    markFieldChanged('videoImage'); // Mark thumbnail field as changed
    setError((prev) => ({ ...prev, thumbnailurlError: "" }));
  };

  const handleCloseAddCategory = () => {
    setAddVideoOpen(false);
    dispatch(closeDialog());
  };

  const validateForm = (): boolean => {
    let newErrors: any = {};
    let isValid = true;

    if (!userId) {
      newErrors.userId = "User Is Required !";
      isValid = false;
    }

    if (mediaSourceKind === 1 && !videoUrl) {
      newErrors.videoUrlError = "Video URL is required!";
      isValid = false;
    }

    if (mediaSourceKind === 2 && !fileData && !dialogueData?.videoUrl) {
      newErrors.video = "Please select a video file!";
      isValid = false;
    }

    if (thumbnailType === 1 && !videoThumbUrl) {
      newErrors.thumbnailurlError = "Thumbnail URL is required!";
      isValid = false;
    }

    if (thumbnailType === 2 && !thumbnail && !dialogueData?.videoImage) {
      newErrors.thumbnailurlError = "Please select a thumbnail file!";
      isValid = false;
    }

    setError((prev) => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const buildPayload = (uploadResult: { videoUrl: string; videoImage: string }) => {
    const basePayload: any = {};

    // For new records, include all required fields
    if (!mongoId) {
      return {
        liveStreamMode: 1,
        thumbnailType: thumbnailType,
        mediaSourceKind: mediaSourceKind,
        videoUrl: uploadResult.videoUrl,
        videoImage: uploadResult.videoImage,
        userId: typeof userId === 'string' ? userId : (userId as { _id: string })?._id,
        videoTime: videoTime,
      };
    }

    // For updates, only include changed fields
    // if (changedFields.userId && userId !== originalValues.userId) {
      basePayload.userId = typeof userId === 'string' ? userId : (userId as { _id: string })?._id;
    // }

    if (changedFields.mediaSourceKind && mediaSourceKind !== originalValues.mediaSourceKind) {
      basePayload.mediaSourceKind = mediaSourceKind;
    }

    if (changedFields.thumbnailType && thumbnailType !== originalValues.thumbnailType) {
      basePayload.thumbnailType = thumbnailType;
    }

    if (changedFields.videoUrl && uploadResult.videoUrl !== originalValues.videoUrl) {
      basePayload.videoUrl = uploadResult.videoUrl;
    }

    if (changedFields.videoImage && uploadResult.videoImage !== originalValues.videoImage) {
      basePayload.videoImage = uploadResult.videoImage;
    }

    if (changedFields.videoTime && videoTime !== originalValues.videoTime) {
      basePayload.videoTime = videoTime;
    }

    if (changedFields.liveStreamMode) {
      basePayload.liveStreamMode = 1;
    }

    return basePayload;
  };

  const handleSubmit = async () => {
    

    if (!validateForm()) {
      return;
    }

    try {
      const uploadResult = await handleFileUploads();
      
      if (!uploadResult) {
        return; // Error already set in handleFileUploads
      }

      const payloadData = buildPayload(uploadResult);

      // Check if there are any changes for update
      if (mongoId && Object.keys(payloadData).length === 0) {
        console.log("No changes detected, skipping update");
        dispatch(closeDialog());
        return;
      }

      if (mongoId) {
        // Update existing video with only changed fields
        let payload: any = {
          ...payloadData,
          videoId: mongoId,
        };

        const payloadToSend: any = {
          data : payload
        }
        await dispatch(updateLiveVideo(payloadToSend)).unwrap();
      } else {
        // Create new video with all fields
        let payload: any = { data: payloadData };
        await dispatch(addLiveVideo(payload)).unwrap();
      }
      
      dispatch(closeDialog());
    } catch (error) {
      console.error("Submit failed:", error);
      setError((prev) => ({
        ...prev,
        video: "Failed to save video. Please try again.",
      }));
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
            <p className="m-0">{dialogueData ? "Edit Video" : "Add Video"}</p>
          </div>
          <div className="model-body">
            <form>
              <div className="row sound-add-box videoCreateModel d-flex align-items-end">
                <div className="col-12 col-lg-6 col-sm-6 mt-2 country-dropdown">
                  <Selector
                    label={"Fake User"}
                    isdisabled={dialogueData}
                    selectValue={userId}
                    placeholder={"Enter Details..."}
                    selectData={fakePostDataGet}
                    selectId={true}
                    errorMessage={error.userId}
                    onChange={(e: any) => {
                      const newUserId = e.target.value;
                      setUserId(newUserId);
                      
                      // Mark as changed if different from original
                      if (newUserId !== originalValues.userId) {
                        markFieldChanged('userId');
                      }

                      if (!newUserId) {
                        setError({
                          ...error,
                          userId: "UserId Is Required",
                        });
                      } else {
                        setError({ ...error, userId: "" });
                      }
                    }}
                  />
                </div>
                <div className="col-12 col-lg-6 col-sm-6 mt-2 country-dropdown" />

                <div className={`col-12 col-lg-${dialogueData ? "12" : "6"} col-sm-6 mt-2 country-dropdown`}>
                  <Selector
                    label={"Media Type"}
                    selectValue={mediaSourceKind}
                    placeholder={"select type"}
                    selectData={[
                      { _id: 2, name: "File" },
                      { _id: 1, name: "Link" },
                    ]}
                    selectId={true}
                    errorMessage={error.mediaSourceKind}
                    onChange={(e: any) => {
                      const newMediaSourceKind = e.target.value;
                      setMediaSourceKind(newMediaSourceKind);

                      // Mark as changed if different from original
                      if (newMediaSourceKind !== originalValues.mediaSourceKind) {
                        markFieldChanged('mediaSourceKind');
                      }

                      if (!newMediaSourceKind) {
                        setError({
                          ...error,
                          mediaSourceKind: "Media type Is Required",
                        });
                      } else {
                        setError({ ...error, mediaSourceKind: "" });
                      }
                    }}
                  />
                </div>
                <div className={`col-12 col-lg-${dialogueData ? "12" : "6"} col-sm-6 mt-2 country-dropdown`}>
                  <Selector
                    label={"Thumbnail Type"}
                    selectValue={thumbnailType}
                    placeholder={"select type"}
                    selectData={[
                      { _id: 2, name: "File" },
                      { _id: 1, name: "Link" },
                    ]}
                    selectId={true}
                    errorMessage={error.thumbnailType}
                    onChange={(e: any) => {
                      const newThumbnailType = e.target.value;
                      setthumbnailType(newThumbnailType);

                      // Mark as changed if different from original
                      if (newThumbnailType !== originalValues.thumbnailType) {
                        markFieldChanged('thumbnailType');
                      }

                      if (!newThumbnailType) {
                        setError({
                          ...error,
                          thumbnailType: "Media type Is Required",
                        });
                      } else {
                        setError({ ...error, thumbnailType: "" });
                      }
                    }}
                  />
                </div>

                {mediaSourceKind == 1 ? (
                  <div className="col-12 col-lg-6 col-sm-6 mt-2">
                    <Input
                      label={"Video"}
                      name={"video Url"}
                      placeholder={"Video Url"}
                      errorMessage={error.videoUrlError}
                      value={videoUrl}
                      onChange={async (e: any) => {
                        const newVideoUrl = e.target.value;
                        setVideoUrl(newVideoUrl);
                        setVideoPath(newVideoUrl);
                        setPreviewVideoUrl(newVideoUrl);

                        // Mark as changed if different from original
                        if (newVideoUrl !== originalValues.videoUrl) {
                          markFieldChanged('videoUrl');
                        }

                        if (!newVideoUrl) {
                          setError({
                            ...error,
                            videoUrlError: "Invalid Url",
                          });
                        } else {
                          setError({ ...error, videoUrlError: "" });
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="col-6 mt-2">
                    <label htmlFor="">Video {isVideoChanged && "(Changed)"}</label>
                    <input
                      className="form-control"
                      id={`video`}
                      type={`file`}
                      accept={`video/*`}
                      onChange={handleVideo}
                    />
                    {error.video && <div className="text-danger">{error.video}</div>}
                  </div>
                )}

                {thumbnailType == 1 ? (
                  <div className="col-12 col-lg-6 col-sm-6 mt-2">
                    <Input
                      label={"Thumbnail"}
                      name={"video thumbnail Url"}
                      placeholder={"Video thumbnail Url"}
                      value={videoThumbUrl}
                      errorMessage={error.thumbnailurlError}
                      onChange={async (e: any) => {
                        const newThumbnailUrl = e.target.value;
                        setVideoThumbUrl(newThumbnailUrl);
                        setPreviewImageUrl(newThumbnailUrl);

                        // Mark as changed if different from original
                        if (newThumbnailUrl !== originalValues.videoImage) {
                          markFieldChanged('videoImage');
                        }

                        if (!newThumbnailUrl) {
                          setError({
                            ...error,
                            thumbnailurlError: "Invalid Url",
                          });
                        } else {
                          setError({ ...error, thumbnailurlError: "" });
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="col-12 col-lg-6 col-sm-6 mt-2">
                    <label htmlFor="">Thumbnail {isThumbnailChanged && "(Changed)"}</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                    />
                    {error.thumbnailurlError && <div className="text-danger">{error.thumbnailurlError}</div>}
                  </div>
                )}

                {(previewVideoUrl || videoPath) && (
                  <div className="col-6 d-flex mt-4 videoShow">
                    <video
                      controls
                      style={{ width: "150px", height: "150px" }}
                      src={previewVideoUrl || videoPath || ""}
                    />
                  </div>
                )}

                <div className="col-12 col-lg-6 col-sm-6 mt-2">
                  {(videoThumbUrl || previewImageUrl) && (
                    <img
                      src={videoThumbUrl || previewImageUrl || ""}
                      alt="Thumbnail preview"
                      style={{
                        width: "150px",
                        height: "150px",
                        marginLeft: "20px",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>
              </div>
            </form>
          </div>
          <div className="model-footer">
            <div className="p-3 d-flex justify-content-end">
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

export default CreateLiveVideo;