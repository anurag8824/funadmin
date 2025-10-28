import React, { useEffect, useState } from "react";
import Button from "../../extra/Button";
import Input from "../../extra/Input";
import Selector from "../../extra/Selector";
import { useSelector } from "react-redux";
import { getCountry, addFakeUser } from "../../store/userSlice";
import { closeDialog } from "../../store/dialogSlice";
import ReactSelect from "react-select";
import { RootStore, useAppDispatch } from "@/store/store";

import { uploadFile } from "@/store/adminSlice";
import { projectName } from "@/util/config";
import { IconChevronCompactLeft } from "@tabler/icons-react";


interface ErrorState {
  fullName: string;
  nickName: string;
  mobileNumber: string;
  email: string;
  gender: string;
  country: string;
  age: string;
  bio: string;
  image: string;
}

function NewFakeUser() {
  const AgeNumber = Array.from(
    { length: 100 - 18 + 1 },
    (_, index) => index + 18
  );
  const { dialogueData } = useSelector((state: any) => state.dialogue);
  const { countryData } = useSelector((state: any) => state.user);

  const dispatch = useAppDispatch();
  const [gender, setGender] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [nickName, setNickName] = useState<string>("");
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [countryDataSelect, setCountryDataSelect] = useState<any>({});
  const [image, setImage] = useState<any>();
  const [imagePath, setImagePath] = useState<string>(
    dialogueData ? dialogueData?.image : ""
  );
  const [age, setAge] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [error, setError] = useState<ErrorState>({
    fullName: "",
    nickName: "",
    mobileNumber: "",
    email: "",
    gender: "",
    country: "",
    age: "",
    bio: "",
    image: "",
  });

  useEffect(() => {
    dispatch(getCountry());
  }, []);

  useEffect(() => {
    if (countryData?.length > 0) {
      const defaultCountry = countryData.find(
        (country) => country?.name?.common === "India"
      );
      if (defaultCountry) {
        setCountryDataSelect(defaultCountry);
      }
    }
  }, [countryData]);

  let folderStructure: string = `${projectName}/admin/userImage`;

  const handleFileUpload = async (image: any) => {
    // // Get the uploaded file from the event
    const file = image[0]
    const formData = new FormData();

    formData.append("folderStructure", folderStructure);
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
          setImage(response.data.url);
          setImagePath(response.data.url);

          return response.data.url
        }
      }
    }
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImage([e.target.files[0]]);
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
        src={data?.flags?.png ? data?.flags?.png : "No Image"}
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

      

  const handleSubmit = async() => {
    
    if (
      !fullName ||
      !nickName ||
      !mobileNumber ||
      !email ||
      !age ||
      !gender ||
      !countryDataSelect ||
      !image
    ) {
      let error = {} as ErrorState;
      if (!fullName) error.fullName = "Name Is Required !";
      if (!nickName) error.nickName = "User name Is Required !";
      if (!mobileNumber) error.mobileNumber = "Mobile Number Is Required !";
      if (!email) {
        error.email = "Email Is Required !";
      }
      if (!gender) error.gender = "Gender Is Required !";
      if (!image) error.image = "Image Is Required !";
      if (!bio) error.bio = "Bio Is Required !";
      if (!age) error.age = "Age is required !";
      if (!countryDataSelect) error.country = "Country is required !";
      if (!age) error.age = "Age is required !";

      return setError({ ...error });
    } else {

      const url = await handleFileUpload(image);

      const paylaod: any = {
        name: fullName,
        userName: nickName,
        gender: gender,
        age: age,
        image: url,
        bio: bio,
        country: countryDataSelect?.name?.common,
        countryFlagImage: countryDataSelect?.flags?.png,
        email: email,
        mobileNumber: mobileNumber,
      };

      const payload: any = {
        data: paylaod,
      };

     

      dispatch(addFakeUser(payload));
      dispatch(closeDialog());
    }
  };

  return (
    // <div>
    //   <div className="general-setting fake-user ">
    //     <div className=" userSettingBox">
    //       <form>
    //         <div className="row d-flex  align-items-center">
    //           <div className="col-12 col-sm-6 col-md-6 col-lg-6 mb-1 mb-sm-0">
    //             <h5 className="mb-0">Create Fake User</h5>
    //           </div>
    //           <div className="col-12 col-sm-6 col-md-6 col-lg-6 d-flex justify-content-end">
    //             <Button
    //               btnName={"Back"}
    //               newClass={"back-btn"}
    //               onClick={() => dispatch(closeDialog())}
    //             />
    //           </div>
    //           <div
    //             className="col-12 d-flex justify-content-end align-items-center"
    //             style={{
    //               paddingTop: "8px",
    //               marginTop: "11px",
    //               borderTop: "1px solid #c9c9c9",
    //             }}
    //           >
    //             <Button
    //               newClass={"submit-btn"}
    //               btnName={"Submit"}
    //               type={"button"}
    //               onClick={handleSubmit}
    //             />
    //           </div>
    //           <div className="row mt-3">
    //             <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
    //               <Input
    //                 label={"Name"}
    //                 name={"name"}
    //                 placeholder={"Enter Details..."}
    //                 errorMessage={error.fullName && error.fullName}
    //                 defaultValue={dialogueData && dialogueData.name}
    //                 onChange={(e) => {
    //                   setFullName(e.target.value);
    //                   if (!e.target.value) {
    //                     return setError({
    //                       ...error,
    //                       fullName: `Name Is Required`,
    //                     });
    //                   } else {
    //                     return setError({
    //                       ...error,
    //                       fullName: "",
    //                     });
    //                   }
    //                 }}
    //               />
    //             </div>
    //             <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
    //               <Input
    //                 label={"User name"}
    //                 name={"userName"}
    //                 placeholder={"Enter Details..."}
    //                 errorMessage={error.nickName && error.nickName}
    //                 defaultValue={dialogueData && dialogueData.userName}
    //                 onChange={(e) => {
    //                   setNickName(e.target.value);
    //                   if (!e.target.value) {
    //                     return setError({
    //                       ...error,
    //                       nickName: `User name Is Required`,
    //                     });
    //                   } else {
    //                     return setError({
    //                       ...error,
    //                       nickName: "",
    //                     });
    //                   }
    //                 }}
    //               />
    //             </div>
    //             <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
    //               <Input
    //                 label={"E-mail Address"}
    //                 name={"email"}
    //                 errorMessage={error.email && error.email}
    //                 defaultValue={dialogueData && dialogueData.email}
    //                 placeholder={"Enter Details..."}
    //                 onChange={(e) => {
    //                   setEmail(e.target.value);
    //                   if (!e.target.value) {
    //                     return setError({
    //                       ...error,
    //                       email: `Email Is Required`,
    //                     });
    //                   } else {
    //                     return setError({
    //                       ...error,
    //                       email: "",
    //                     });
    //                   }
    //                 }}
    //               />
    //             </div>

    //             <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
    //               <Input
    //                 label={"Mobile Number"}
    //                 name={"mobileNumber"}
    //                 type={"number"}
    //                 placeholder={"Enter Details..."}
    //                 errorMessage={error.mobileNumber && error.mobileNumber}
    //                 defaultValue={dialogueData && dialogueData.mobileNumber}
    //                 onChange={(e) => {
    //                   setMobileNumber(e.target.value);
    //                   if (!e.target.value) {
    //                     return setError({
    //                       ...error,
    //                       mobileNumber: `Mobile Number Is Required`,
    //                     });
    //                   } else {
    //                     return setError({
    //                       ...error,
    //                       mobileNumber: "",
    //                     });
    //                   }
    //                 }}
    //               />
    //             </div>

    //             <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
    //               <Selector
    //                 label={"Gender"}
    //                 selectValue={gender}
    //                 placeholder={"Select Gender"}
    //                 selectData={["Male", "Female"]}
    //                 errorMessage={error.gender && error.gender}
    //                 defaultValue={dialogueData && dialogueData.gender}
    //                 onChange={(e) => {
    //                   setGender(e.target.value);
    //                   if (!e.target.value) {
    //                     return setError({
    //                       ...error,
    //                       gender: `Gender Is Required`,
    //                     });
    //                   } else {
    //                     return setError({
    //                       ...error,
    //                       gender: "",
    //                     });
    //                   }
    //                 }}
    //               />
    //             </div>
    //             <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
    //               <Selector
    //                 label={"Age"}
    //                 selectValue={age}
    //                 placeholder={"Select Age"}
    //                 errorMessage={error.age && error.age}
    //                 defaultValue={dialogueData && dialogueData.age}
    //                 selectData={AgeNumber}
    //                 onChange={(e) => {
    //                   setAge(e.target.value);
    //                   if (!e.target.value) {
    //                     return setError({
    //                       ...error,
    //                       age: `Age Is Required`,
    //                     });
    //                   } else {
    //                     return setError({
    //                       ...error,
    //                       age: "",
    //                     });
    //                   }
    //                 }}
    //               />
    //             </div>
    //             <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
    //               <div className="custom-input">
    //                 <label>Country</label>
    //                 <ReactSelect
    //                   options={countryData || []}
    //                   value={countryDataSelect}
    //                   isClearable={false}
    //                   onChange={(selected) => handleSelectChange(selected)}
    //                   getOptionValue={(option) => option?.name?.common}
    //                   className="mt-2"
    //                   formatOptionLabel={(option) => (
    //                     <div className="optionShow-option">
    //                       <img
    //                         height={30}
    //                         width={30}
    //                         src={
    //                           option?.flags?.png
    //                             ? option?.flags?.png
    //                             : "https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg"
    //                         }
    //                       />
    //                       <span className="ms-2">
    //                         {option?.name?.common
    //                           ? option?.name?.common
    //                           : "India"}
    //                       </span>
    //                     </div>
    //                   )}
    //                   components={{
    //                     Option: CustomOption,
    //                   }}
    //                 />
    //               </div>
    //             </div>
    //             <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2 ">
    //               <Input
    //                 type={"file"}
    //                 label={"Image"}
    //                 accept={"image/png, image/jpeg"}
    //                 errorMessage={error.image && error.image}
    //                 onChange={handleImage}
    //               />
    //             </div>

    //             <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2 fake-create-img">
    //               <img
    //                 src={imagePath}
    //                 alt=""
    //                 draggable={false}
    //                 className={`${
    //                   (!imagePath || imagePath === "") && "d-none"
    //                 } `}
    //                 data-class={`showImage`}
    //                 style={{ width: "100px", height: "100px" }}
    //               />
    //             </div>
    //             <div className="col-12 mt-3 text-about">
    //               <label className="label-form">Bio</label>
    //               <textarea
    //                 cols={6}
    //                 rows={6}
    //                 value={bio}
    //                 onChange={(e) => {
    //                   setBio(e.target.value);
    //                   if (!e.target.value) {
    //                     return setError({
    //                       ...error,
    //                       bio: `Bio Is Required`,
    //                     });
    //                   } else {
    //                     return setError({
    //                       ...error,
    //                       bio: "",
    //                     });
    //                   }
    //                 }}
    //               ></textarea>
    //               {error.bio && (
    //                 <p className="errorMessage">{error.bio && error.bio}</p>
    //               )}
    //             </div>
    //           </div>
    //         </div>
    //       </form>
    //     </div>
    //   </div>
    // </div>

    <div className="user-table  mb-3">
      <div className="user-table-top">
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h5
            style={{
              fontWeight: "500",
              fontSize: "18px",
              marginBottom: "5px",
              marginTop: "5px",
              markerStart: "10px",
            }}
          >
            Create Fake User
          </h5>
          <Button
            btnName={"Back"}
            newClass={"back-btn"}
            btnIcon={<IconChevronCompactLeft/>}
            onClick={() => dispatch(closeDialog())}
          />
        </div>
      </div>
      <form>
        <div className="row d-flex  align-items-center">
          {/* <div className="col-12 col-sm-6 col-md-6 col-lg-6 d-flex justify-content-end">
                <Button
                  btnName={'Back'}
                  newClass={'back-btn'}
                  onClick={() => dispatch(closeDialog())}
                />
              </div> */}
          {/* <div
                className="col-12 d-flex justify-content-end align-items-center"
                style={{
                  paddingTop: '8px',
                  marginTop: '11px',
                  borderTop: '1px solid #c9c9c9',
                }}
              >
                <Button
                  newClass={'submit-btn'}
                  btnName={'Submit'}
                  type={'button'}
                  onClick={handleSubmit}
                />
              </div> */}
          <div className="row mt-3 px-5">
            <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
              <Input
                label={"Name"}
                name={"name"}
                placeholder={"Enter Details..."}
                errorMessage={error.fullName && error.fullName}
                defaultValue={dialogueData && dialogueData.name}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (!e.target.value) {
                    return setError({
                      ...error,
                      fullName: `Name Is Required`,
                    });
                  } else {
                    return setError({
                      ...error,
                      fullName: "",
                    });
                  }
                }}
              />
            </div>
            <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
              <Input
                label={"User name"}
                name={"userName"}
                placeholder={"Enter Details..."}
                errorMessage={error.nickName && error.nickName}
                defaultValue={dialogueData && dialogueData.userName}
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
                errorMessage={error.email && error.email}
                defaultValue={dialogueData && dialogueData.email}
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

            <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
              <Input
                label={"Mobile Number"}
                name={"mobileNumber"}
                type={"number"}
                placeholder={"Enter Details..."}
                errorMessage={error.mobileNumber && error.mobileNumber}
                defaultValue={dialogueData && dialogueData.mobileNumber}
                onChange={(e) => {
                  setMobileNumber(e.target.value);
                  if (!e.target.value) {
                    return setError({
                      ...error,
                      mobileNumber: `Mobile Number Is Required`,
                    });
                  } else {
                    return setError({
                      ...error,
                      mobileNumber: "",
                    });
                  }
                }}
              />
            </div>

            <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
              <Selector
                label={"Gender"}
                selectValue={gender}
                placeholder={"Select Gender"}
                selectData={["Male", "Female"]}
                errorMessage={error.gender && error.gender}
                defaultValue={dialogueData && dialogueData.gender}
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
                defaultValue={dialogueData && dialogueData.age}
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
            <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
              <div className="custom-input">
                <label>Country</label>
                <ReactSelect
                  options={countryData || []}
                  value={countryDataSelect}
                  isClearable={false}
                  onChange={(selected) => handleSelectChange(selected)}
                  getOptionValue={(option) => option?.name?.common}
                  className="mt-2"
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
                  components={{
                    Option: CustomOption,
                  }}
                />
              </div>
            </div>
            <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2 ">
              <Input
                type={"file"}
                label={"Image"}
                accept={"image/png, image/jpeg"}
                errorMessage={error.image && error.image}
                onChange={handleImage}
              />
              <p className="fw-medium m-0 text-danger" style={{fontSize : "small"}}>(Note: Accept .png, .jpg)</p>
            </div>

            <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2 fake-create-img">
              <img
                src={imagePath && imagePath}
                alt=""
                draggable={false}
                className={`${(!imagePath || imagePath === "") && "d-none"} `}
                data-class={`showImage`}
                style={{ width: "100px", height: "100px" }}
              />
            </div>
            <div className="col-12 mt-3 text-about">
              <label className="label-form">Bio</label>
              <textarea
                cols={6}
                rows={6}
                className="w-100"
                style={{
                  border: "1px solid #eee",
                  borderRadius: "5px",
                }}
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  if (!e.target.value) {
                    return setError({
                      ...error,
                      bio: `Bio Is Required`,
                    });
                  } else {
                    return setError({
                      ...error,
                      bio: "",
                    });
                  }
                }}
              ></textarea>
              {error.bio && (
                <p className="errorMessage">{error.bio && error.bio}</p>
              )}
            </div>
          </div>
          <div className="p-4 d-flex">
            <Button
              newClass={"submit-btn"}
              btnName={"Submit"}
              type={"button"}
              onClick={handleSubmit}
            />
          </div>
        </div>
      </form>
    </div>
  );
}

export default NewFakeUser;
