"use client";

// React Imports
import { useState } from "react";

// Next Imports
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// MUI Imports
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Divider from "@mui/material/Divider";

// Third-party Imports
import { signIn } from "next-auth/react";
import { Controller, useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { email, object, minLength, string, pipe, nonEmpty } from "valibot";
import type { SubmitHandler } from "react-hook-form";
import type { InferInput } from "valibot";

// Component Imports
import Logo from "@components/layout/shared/Logo";
import CustomTextField from "@core/components/mui/TextField";

// Config Imports
import themeConfig from "@configs/themeConfig";

// Styled Component Imports
import AuthIllustrationWrapper from "./AuthIllustrationWrapper";

// Form Validation Schema
const schema = object({
  email: pipe(string(), minLength(1, 'This field is required'), email('Email is invalid')),
  password: pipe(
    string(),
    nonEmpty('This field is required'),
    minLength(5, 'Password must be at least 5 characters long')
  )
})

type ErrorType = {
  message: string[]
}

type FormData = InferInput<typeof schema>;

const LoginV1 = () => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Hooks
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: valibotResolver(schema),
    defaultValues: {
      email: 'student1111@devhub.com',
      password: '123123'
    }
  })

  const handleClickShowPassword = () => setIsPasswordShown((show) => !show);

  // ** Submit Handler **
  const onSubmit: SubmitHandler<FormData> = async (data: FormData) => {
    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false, // Prevents automatic redirection
      });

      if (res?.ok) {
        // Redirect the user after successful login
        const redirectURL = searchParams.get("redirectTo") ?? "/";
        router.replace(redirectURL);
      } else {
        // ❌ Old: setErrorState({ message: ['Invalid email or password.'] })
        // ✅ Fix: Store error message as a string
        setErrorState("Invalid email or password.");
      }
    } catch (error) {
      setErrorState("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <AuthIllustrationWrapper>
      <Card className="flex flex-col sm:is-[450px] ">
        <CardContent className="sm:!p-12">
          <Link href={"/"} className="flex justify-center mbe-6">
            <Logo />
          </Link>
          <div className="flex flex-col gap-1 mbe-6">
            <Typography variant="h4">{`Welcome to ${themeConfig.templateName}! 👋🏻`}</Typography>
            <Typography>Please sign-in to your account and start the adventure</Typography>
          </div>
          {/* ** Login Form ** */}
          <form noValidate autoComplete="off" action={() => { }} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <Controller
              name="email"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  autoFocus
                  fullWidth
                  type="email"
                  label="Email"
                  placeholder="Enter your email"
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    setErrorState(null); // Clear error when user types
                  }}
                  {...((errors.email || errorState) && {
                    error: true,
                    helperText: errors?.email?.message || errorState, // ✅ Use string error message
                  })}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Password'
                  placeholder='············'
                  id='login-password'
                  type={isPasswordShown ? 'text' : 'password'}
                  onChange={e => {
                    field.onChange(e.target.value)
                    errorState !== null && setErrorState(null)
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton edge='end' onClick={handleClickShowPassword} onMouseDown={e => e.preventDefault()}>
                          <i className={isPasswordShown ? 'tabler-eye' : 'tabler-eye-off'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  {...(errors.password && { error: true, helperText: errors.password.message })}
                />
              )}
            />
            {errorState && (
              <Typography color="error" className="text-center">
                {errorState}
              </Typography>
            )}
            <div className="flex justify-between items-center gap-x-3 gap-y-1 flex-wrap">
              <FormControlLabel control={<Checkbox />} label="Remember me" />
              <Typography className="text-end" color="primary" component={Link} href={"/pages/auth/forgot-password-v1"}>
                Forgot password?
              </Typography>
            </div>
            <Button fullWidth variant="contained" type="submit">
              Login
            </Button>
            <div className="flex justify-center items-center flex-wrap gap-2">
              <Typography>New on our platform?</Typography>
              <Typography component={Link} href={"/pages/auth/register-v1"} color="primary">
                Create an account
              </Typography>
            </div>
            <Divider className="gap-2 text-textPrimary">or</Divider>
            <div className="flex justify-center items-center gap-1.5">
              <IconButton className="text-facebook" size="small">
                <i className="tabler-brand-facebook-filled" />
              </IconButton>
              <IconButton className="text-twitter" size="small">
                <i className="tabler-brand-twitter-filled" />
              </IconButton>
              <IconButton className="text-textPrimary" size="small">
                <i className="tabler-brand-github-filled" />
              </IconButton>
              <IconButton className="text-error" size="small">
                <i className="tabler-brand-google-filled" />
              </IconButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthIllustrationWrapper>
  );
};

export default LoginV1;
