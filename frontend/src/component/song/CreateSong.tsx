import React, { useEffect, useState } from "react";
import { Box, Modal, Typography } from "@mui/material";
import Input from "../../extra/Input";
import Selector from "../../extra/Selector";
import Button from "../../extra/Button";
import ReactAudioPlayer from "react-audio-player";
import { useSelector } from "react-redux";
import { addSong, allSongCategory, updateSong } from "../../store/songSlice";
import { closeDialog } from "../../store/dialogSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { baseURL, projectName } from "@/util/config";

import { uploadFile } from "@/store/adminSlice";


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
};

interface ErrorState {
  singerName?: string;
  soundTitle?: string;
  soundLink?: string;
  image?: string;
  soundTime?: string;
  soundCategoryId: string;
}

const CreateSong: React.FC = () => {
  const { dialogue, dialogueData } = useSelector(
    (state: RootStore) => state.dialogue
  );
  const { songCategoryData } = useSelector(
    (state: RootStore) => state.song
  );


  const dispatch = useAppDispatch();

  

  const [addSongOpen, setAddSongOpen] = useState(false);
  const [mongoId, setMongoId] = useState<string | undefined>();
  const [singerName, setSingerName] = useState<string>();
  const [soundTitle, setSoundTitle] = useState<string>();
  const [soundLink, setSoundLink] = useState<File>();
  const [image, setImage] = useState<any>();
  const [imagePath, setImagePath] = useState<string>("");
  const [soundCategoryId, setSoundCategoryId] = useState<string>();
  const [soundCategoryDataGet, setSoundCategoryDataGet] = useState<any>();
  const [soundTime, setSoundTime] = useState<number>();
  const [showSound, setShowSound] = useState<string>();

  const [error, setError] = useState<ErrorState>({
    singerName: "",
    soundTitle: "",
    soundLink: "",
    image: "",
    soundTime: "",
    soundCategoryId: "",
  });

  useEffect(() => {
    const payload: any = {
      data: "",
    };
    dispatch(allSongCategory(payload));
  }, []);

  useEffect(() => {
    setAddSongOpen(dialogue);
    if (dialogueData) {
      setMongoId(dialogueData?._id);
      setSingerName(dialogueData?.singerName);
      setSoundCategoryId(dialogueData?.songCategoryId?._id);
      setSoundTime(dialogueData?.songTime.toFixed(2));
      setSoundTitle(dialogueData?.songTitle);
      setShowSound(dialogueData?.songLink);
      setImagePath(dialogueData?.songImage);
    }
  }, [dialogue, dialogueData]);

  useEffect(() => {
    setSoundCategoryDataGet(songCategoryData);
  }, [songCategoryData]);

  const handleCloseAddCategory = () => {
    setAddSongOpen(false);
    dispatch(closeDialog());
  };

  // const handleSoundUpload = async (
  //   event: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   const file = event.target.files && event.target.files[0];
  //   if (!file) return;
  //   setSoundLink(file);
  //   setShowSound(URL.createObjectURL(file));
  //   const selectedFile = file;
  //   const videoElement = document.createElement("video");
  //   videoElement.src = URL.createObjectURL(selectedFile);
  //   videoElement.addEventListener("loadedmetadata", () => {
  //     const durationInSeconds = videoElement.duration;
  //     const durationInMilliseconds = durationInSeconds;
  //     setSoundTime(durationInMilliseconds);
  //   });

  //   setError({ ...error, soundLink: "" });
  // };

  let folderStructure: string = `${projectName}/admin/songImage`;
  let folderSoundStructure: string = `${projectName}/admin/songLink`;

  const handleImage = (e: any) => {
    if (e.target.files && e.target.files[0]) {
      setImage([e.target.files[0]]);
      setImagePath(URL.createObjectURL(e.target.files[0]));
    }
  };


  const handleFileUpload = async (image: any) => {
    // // Get the uploaded file from the event
    const file = image[0];
    const formData = new FormData();

    formData.append("folderStructure", folderStructure);
    formData.append("keyName", file?.name);
    formData.append("content", file);

    // Create a payload for your dispatch
    const payloadformData: any = {
      data: formData,
    };

    if (formData) {
      const response: any = await dispatch(uploadFile(payloadformData)).unwrap();

      if (response?.data?.status) {

        if (response.data.url) {
          setImage(response.data.url);
          setImagePath(response.data.url);

          return response.data.url
        }
      }
    }
  };


  const handleSoundUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    setSoundLink(file);
    setShowSound(URL.createObjectURL(file));
    const selectedFile = file;
    const videoElement = document.createElement("video");
    videoElement.src = URL.createObjectURL(selectedFile);
    videoElement.addEventListener("loadedmetadata", () => {
      const durationInSeconds = videoElement.duration;
      setSoundTime(parseFloat(durationInSeconds.toFixed(2)));
    });

    setError({ ...error, soundLink: "" });
  };



  const handleUpload = async (soundLink: any) => {
    const file = soundLink;
    const formData = new FormData();

    formData.append("folderStructure", folderSoundStructure);
    formData.append("keyName", file?.name);
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
          setShowSound(response.data.url);
          setSoundLink(response.data.url);

          return response.data.url;
        }
      }
    }
    setShowSound(URL.createObjectURL(file));
    const selectedFile = file;
    const videoElement = document.createElement("video");
    videoElement.src = URL.createObjectURL(selectedFile);
    videoElement.addEventListener("loadedmetadata", () => {
      const durationInSeconds = videoElement.duration;
      setSoundTime(parseFloat(durationInSeconds.toFixed(2)));
    });

    setError({ ...error, soundLink: "" });
  };


  const handleSubmit = async () => {
    
    if (
      !singerName ||
      !soundTitle ||
      !soundCategoryId ||
      !soundTime ||
      !showSound ||
      !imagePath
    ) {
      let error = {} as ErrorState;
      if (!singerName) error.singerName = "Name is required";
      if (!soundTitle) error.soundTitle = "Sound Title is required";
      if (!soundCategoryId)
        error.soundCategoryId = "Sound CategoryId is required";
      if (!soundTime) error.soundTime = "Sound Time is required";
      if (!showSound) error.soundLink = "Sound Link is required";
      if (!imagePath) error.image = "Image is required";
      return setError({ ...error });
    } else {
      let songUrl;
      let songImageUrl;
      if (!dialogueData) {
         songUrl = await handleUpload(soundLink);
         songImageUrl = await handleFileUpload(image)
      }else {
        if(soundLink){
         songUrl = await handleUpload(soundLink);

        }else if(image){
         songImageUrl = await handleFileUpload(image);

        }
      }


      let payloadData = {
        singerName: singerName,
        songTitle: soundTitle,
        songCategoryId: soundCategoryId,
        songTime: !isNaN(Number(soundTime)) ? Number(soundTime).toFixed(2) : "0.00",

        songLink: songUrl,
        songImage: songImageUrl,
      };
      // formData.append("singerName", singerName!);
      // formData.append("songTitle", soundTitle!);
      // formData.append("songCategoryId", soundCategoryId!);
      // formData.append("songTime", soundTime!.toString());
      // formData.append("songLink", soundLink!);
      // formData.append("songImage", image!);

      if (mongoId) {
        const payload: any = {
          data: payloadData,
          songId: mongoId,
        };
        dispatch(updateSong(payload));
      } else {
        const payload: any = {
          data: payloadData,
        };
        dispatch(addSong(payload));
      }

      dispatch(closeDialog());
    }
  };

  return (
    <div>
      <Modal
        open={addSongOpen}
        onClose={handleCloseAddCategory}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="">
           <div className="model-header">
            <p className="m-0">
               {dialogueData ? "Edit Sound" : "Add Sound"}
            </p>
          </div>
          <div  className="model-body">
          <form>
            <div className="row sound-add-box">
              <div className="col-lg-6 col-sm-12">
                <Input
                  label={"Singer Name"}
                  name={"name"}
                  placeholder={"Enter Details..."}
                  value={singerName}
                  errorMessage={error.singerName && error.singerName}
                  onChange={(e) => {
                    setSingerName(e.target.value);
                    if (!e.target.value) {
                      return setError({
                        ...error,
                        singerName: `Name Is Required`,
                      });
                    } else {
                      return setError({
                        ...error,
                        singerName: "",
                      });
                    }
                  }}
                />
              </div>
              <div className="col-lg-6 col-sm-12">
                <Input
                  label={"Sound Title"}
                  name={"soundTitle"}
                  placeholder={"Enter Details..."}
                  value={soundTitle}
                  errorMessage={error.soundTitle && error.soundTitle}
                  onChange={(e) => {
                    setSoundTitle(e.target.value);
                    if (!e.target.value) {
                      return setError({
                        ...error,
                        soundTitle: `Sound Title Is Required`,
                      });
                    } else {
                      return setError({
                        ...error,
                        soundTitle: "",
                      });
                    }
                  }}
                />
              </div>
              <div className="col-12 col-lg-6 col-sm-12 mt-2">
                <Selector
                  label={"Sound Category"}
                  selectValue={soundCategoryId}
                  placeholder={"Select Category"}
                  selectData={soundCategoryDataGet}
                  selectId={true}
                  errorMessage={error.soundCategoryId && error.soundCategoryId}
                  onChange={(e) => {
                    setSoundCategoryId(e.target.value);
                    if (!e.target.value) {
                      return setError({
                        ...error,
                        soundCategoryId: `Sound Category Is Required`,
                      });
                    } else {
                      return setError({
                        ...error,
                        soundCategoryId: "",
                      });
                    }
                  }}
                />
              </div>
              <div className="col-lg-6 col-sm-12 mt-2">
                <Input
                  label={"Sound Time (seconds)"}
                  name={"soundTime"}
                  disabled={true}
                  placeholder={"Sound Upload"}
                  value={soundTime}
                />
              </div>
              <div className="col-lg-6 col-sm-12 mt-2">
                <Input
                  type={"file"}
                  label={"Sound Upload (MP3)"}
                  accept={".mp3,audio/*"}
                  errorMessage={error.soundLink && error.soundLink}
                  onChange={handleSoundUpload}
                />
                {showSound && (
                  <div className="mt-3">
                    <ReactAudioPlayer
                      src={showSound}
                      controls
                      style={{ width: "250px" }}
                      onPlay={() => console.log("Audio is playing")}
                      onError={(error) => console.error("Audio error:", error)}
                    />
                  </div>
                )}
              </div>
              <div className="col-lg-6 col-sm-12 mt-2">
                <Input
                  type={"file"}
                  label={"Sound Image"}
                  accept={"image/png, image/jpeg"}
                  errorMessage={error.image && error.image}
                  onChange={handleImage}
                />
                {imagePath && (
                  <div>
                    <img
                      height="100px"
                      width="100px"
                      alt="app"
                      src={imagePath}
                      style={{
                        boxShadow: "0 5px 15px 0 rgb(105 103 103 / 0%)",
                        borderRadius: 10,
                        marginTop: 10,
                        float: "left",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="col-lg-12 col-sm-12 mt-3 audio-upload">
                <div
                  className="video-upload-loader"
                  style={{ width: "100%", height: "unset" }}
                ></div>
              </div>
              <div className="col-lg-12 col-sm-12 mt-3 fake-create-img">
                <div
                  className="video-upload-loader"
                  style={{ width: "100%", height: "unset" }}
                ></div>
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
                btnName={"Submit"}
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

export default CreateSong;
