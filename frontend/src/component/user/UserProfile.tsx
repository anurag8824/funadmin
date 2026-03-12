import Button from "@/extra/Button";
import useClearSessionStorageOnPopState from "@/extra/ClearStorage";
import Input from "@/extra/Input";
import Selector from "@/extra/Selector";
import { closeDialog } from "@/store/dialogSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { updateFakeUser } from "@/store/userSlice";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import EditIcon from "@mui/icons-material/Edit";
import { getUserPost } from "@/store/postSlice";
import { getUserVideo } from "@/store/videoSlice";
import { projectName } from "@/util/config";
import { uploadFile } from "@/store/adminSlice";
import ReactSelect from "react-select";
import male from "../../assets/images/1.jpg";

import NoImageUser from "../../assets/images/user.png";

export default function UserProfile(props) {
  useClearSessionStorageOnPopState("multiButton");

  const AgeNumber = Array.from(
    { length: 100 - 18 + 1 },
    (_, index) => index + 18
  );
  const { dialogueData } = useSelector((state: any) => state.dialogue);
  const { getUserProfileData } = useSelector((state: any) => state.user);

  const [hasMounted, setHasMounted] = useState(false);
  const [postData, setPostData] = useState(null);

  // useEffect(() => {
  //   setHasMounted(true);
  //   // Retrieve postData from localStorage on the client side
  //   const storedData =
  //     typeof window !== "undefined" && localStorage.getItem("postData");
  //   if (storedData) setPostData(JSON.parse(storedData));
  // }, []);

  useEffect(() => {
    setPostData(getUserProfileData);
  }, [getUserProfileData]);

  const { countryData } = useSelector((state: any) => state.user);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const [gender, setGender] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [nickName, setNickName] = useState<string>("");
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [ipAddress, setIpAddress] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [countryDataSelect, setCountryDataSelect] = useState<any>();
  const [image, setImage] = useState("");
  const [bio, setBio] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [imagePath, setImagePath] = useState<string>(
    dialogueData ? dialogueData?.image : ""
  );
  const [age, setAge] = useState<string>("");

  const id = router.query.id;
  const type = router.query.type;

  const [error, setError] = useState<any>({
    name: "",
    nickName: "",
    bio: "",
    mobileNumber: "",
    email: "",
    ipAddress: "",
    gender: "",
    country: "",
    age: "",
    image: "",
  });

  useEffect(() => {
    if (postData) {
      setName(postData?.name);
      setNickName(postData?.userName);
      setGender(postData?.gender);
      setAge(postData?.age);
      setEmail(postData?.email);
      setIpAddress(postData?.ipAddress);
      setBio(postData?.bio);
      setMobileNumber(postData?.mobileNumber);
      // setCountry(postData?.country);
      setImagePath(postData?.image ? postData?.image : male);
      const selectedCountry = countryData.find(
        (item: any) =>
          item?.name?.common?.toLowerCase() ===
          postData?.country?.toString().toLowerCase()
      );

      if (selectedCountry) {
        setCountryDataSelect(selectedCountry);
      }
    }
  }, [postData, id]);

  

  const handleSubmit = async (e: React.FormEvent) => {
    
    e.preventDefault();
    if (!name || !nickName || !email || !age || !gender) {
      let errors: any = {};
      if (!name) errors.name = "Name Is Required !";
      if (!nickName) errors.nickName = "User name Is Required !";

      if (!email) errors.email = "Email Is Required !";
      if (!gender) errors.gender = "Gender Is Required !";
      if (!country) errors.country = "Country is Required !";
      if (!age) errors.age = "Age is required !";

      setError(errors);
    } else {
      const url = await handleFileUpload(image);

      const formData = new FormData();
      formData.append("name", name);
      formData.append("userName", nickName);
      formData.append("gender", gender);
      formData.append("age", age);
      formData.append("country", country);
      formData.append("email", email);
      formData.append("mobileNumber", mobileNumber);
      formData.append("image", image[0]);

      const data = {
        name: name,
        userName: nickName,
        gender: gender,
        age: age,
        country: countryDataSelect.name.common,
        email: email,
        mobileNumber: mobileNumber,
        image: url,
      };
      const payload: any = {
        id: postData?._id,
        data: data,
      };

      dispatch(updateFakeUser(payload));
      dispatch(closeDialog());
      router.back();

      localStorage.setItem("multiButton", JSON.stringify("Fake User"));
    }
  };

  let folderStructure: string = `${projectName}/admin/userImage`;

  const handleFileUpload = async (image: any) => {
    if (!image) {
      return;
    }
    // Get the uploaded file from the event
    const file = image[0];

    const formData = new FormData();

    formData.append("folderStructure", folderStructure);
    formData.append("keyName", image?.name);
    formData.append("content", image);

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
          setImage(response.data.url);
          setImagePath(response.data.url);
          return response.data.url;
        }
      }
    }
  };

  const handleImage = (e: any) => {
    if (e.target.files) {
      setImage(e.target.files[0]);
      setImagePath(URL.createObjectURL(e.target.files[0]));
      setError({ ...error, image: "" });
    }
  };

  const CustomOption: React.FC<{
    innerProps: any;
    label: string;
    data: any;
  }> = ({ innerProps, label, data }) => (
    <div
      {...innerProps}
      className="country-optionList my-2"
      style={{ cursor: "pointer" }}
    >
      <img
        src={data?.flags?.png && data?.flags?.png}
        alt={label}
        height={30}
        width={30}
      />
      <span className="ms-2">{data?.name?.common && data?.name?.common}</span>
    </div>
  );

  const handleSelectChange = (selected: any | null) => {
    setCountryDataSelect(selected);

    if (!selected) {
      return setError({
        ...error,
        country: `Country Is Required`,
      });
    } else {
      return setError({
        ...error,
        country: "",
      });
    }
  };

  return (
    <div className="card1 mt-4  ">
      <div className="cardHeader p-3 ">
        <div className="row d-flex  align-items-center">
          <div className="col-12 col-sm-6 col-md-6 col-lg-6 mb-1 mb-sm-0">
            <h5 className="mb-0">Profile</h5>
          </div>
        </div>
      </div>
      <div className="cardBody d-flex p-3">
        <div className="avatar-setting col-3">
          <div className="userSettingBox">
            <div className="image-avatar-box">
              <div className="cover-img-user"></div>
              <div className="avatar-img-user" style={{ cursor: "pointer" }}>
                <div className="profile-img">
                  {postData?.isFake === true && (
                    <label
                      htmlFor="image"
                      onChange={(e: any) => handleImage(e)}
                    >
                      <div className="avatar-img-icon">
                        {type !== "ViewFakeUser" && (
                          <EditIcon className=" cursorPointer" />
                        )}
                      </div>
                      <input
                        type="file"
                        name="image"
                        id="image"
                        style={{ display: "none" }}
                        disabled={type === "ViewFakeUser" ? true : false}
                      />
                      {imagePath ? (
                        <img
                          src={imagePath}
                           style={{width : "300px" , height : "300px"}}
                          alt="Profile Avatar"
                          onError={(e) => {
                            e.currentTarget.src = NoImageUser.src;
                          }}
                        />
                      ) : (
                        <img
                          src={imagePath}
                          style={{width : "300px" , height : "300px"}}
                          onError={(e) => {
                            e.currentTarget.src = NoImageUser.src;
                          }}
                        />
                      )}
                    </label>
                  )}
                  {postData?.isFake === false && (
                    <img
                     style={{width : "300px" , height : "300px"}}
                      src={imagePath}
                      alt="Profile Avatar"
                      onError={(e) => {
                        e.currentTarget.src = NoImageUser.src;
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="general-setting fake-user col-9">
          <div className=" userSettingBox">
            <form>
              <div className="row ">
                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
                  <Input
                    type={"text"}
                    label={"Name"}
                    name={"name"}
                    placeholder={"Enter Details..."}
                    value={name}
                    readOnly={
                      postData?.isFake !== true || type === "ViewFakeUser"
                    }
                    errorMessage={error.name && error.name}
                    onChange={(e: any) => {
                      setName(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          name: `Name Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          name: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
                  <Input
                    label={"User name"}
                    name={"nickName"}
                    value={nickName}
                    readOnly={
                      postData?.isFake !== true || type === "ViewFakeUser"
                    }
                    placeholder={"Enter Details..."}
                    errorMessage={error.nickName && error.nickName}
                    onChange={(e) => {
                      setNickName(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          nickName: `User name Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          nickName: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
                  <Input
                    label={"E-mail Address"}
                    name={"email"}
                    value={email}
                    readOnly={
                      postData?.isFake !== true || type === "ViewFakeUser"
                    }
                    errorMessage={error.email && error.email}
                    placeholder={"Enter Details..."}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          email: `Email Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          email: "",
                        });
                      }
                    }}
                  />
                </div>

                {/* <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
                  <Input
                    label={"Country"}
                    name={"country"}
                    value={country}
                    errorMessage={error.country && error.country}
                    placeholder={"Enter Details..."}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          country: `Country Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          country: "",
                        });
                      }
                    }}
                  />
                </div> */}

                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
                  <label className="form-label m-0">Country</label>
                  <ReactSelect
                    options={countryData}
                    value={countryDataSelect}
                    isClearable={false}
                    isDisabled={
                      postData?.isFake === false || type === "ViewFakeUser"
                    }
                    onChange={(selectedOption) => {
                      setCountry(selectedOption?.name?.common || "");
                      setCountryDataSelect(selectedOption);
                      if (!selectedOption) {
                        setError({
                          ...error,
                          country: "Country is Required!",
                        });
                      } else {
                        setError({ ...error, country: "" });
                      }
                    }}
                    getOptionLabel={(option) => option?.name?.common}
                    getOptionValue={(option) => option?.name?.common}
                    formatOptionLabel={(option) => (
                      <div className="optionShow-option">
                        <img
                          height={30}
                          width={30}
                          alt={option?.name?.common}
                          src={option?.flags?.png ? option?.flags?.png : ""}
                        />
                        <span className="ms-2">{option?.name?.common}</span>
                      </div>
                    )}
                    className=""
                  />
                  {error.country && (
                    <span className="error-message">{error.country}</span>
                  )}
                </div>

                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
                  <Selector
                    label={"Gender"}
                    selectValue={gender}
                    placeholder={"Select Gender"}
                    selectData={["Male", "Female"]}
                    readOnly={postData?.isFake === false}
                    isdisabled={type === "ViewFakeUser" ? true : false}
                    errorMessage={error.gender && error.gender}
                    data={postData}
                    onChange={(e) => {
                      setGender(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          gender: `Gender Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          gender: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
                  <Selector
                    label={"Age"}
                    selectValue={age}
                    placeholder={"Select Age"}
                    errorMessage={error.age && error.age}
                    readOnly={postData?.isFake === false}
                    isdisabled={type == "ViewFakeUser" ? true : false}
                    data={postData}
                    type={type}
                    selectData={AgeNumber}
                    onChange={(e) => {
                      setAge(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          age: `Age Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          age: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-3">
                  <Input
                    label={"Login Type"}
                    name={"email"}
                    value={
                      postData?.loginType === 1
                        ? "Mobile Number "
                        : postData?.loginType === 2
                        ? "Google "
                        : postData?.loginType === 3
                        ? "Quick"
                        : postData?.loginType === 4
                        ? "Apple"
                        : "-"
                    }
                    disabled={postData?.isFake === true}
                    readOnly={postData?.isFake === false}
                  />
                </div>

                {/* {postData?.coin && ( */}
                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-3">
                  <Input
                    label={"Coin"}
                    name={"coin"}
                    value={postData?.coin}
                    readOnly
                    disabled={true}
                  />
                </div>
                {/* )}  */}
              </div>
            </form>
          </div>
        </div>
      </div>

      {postData?.isFake == true && type != "ViewFakeUser" && (
        <div className="cadrFooter p-3">
          <div className="col-12 col-sm-12 col-md-12 col-lg-12 d-flex justify-content-end m">
            <Button
              newClass={"submit-btn"}
              btnName={"Submit"}
              type={"button"}
              onClick={(e: any) => handleSubmit(e)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
