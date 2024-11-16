import { Spinner as NextUISpinner, SpinnerProps } from "@nextui-org/react";

const Spinner = (props: SpinnerProps) => {
  const defaultProps = {
    size: "lg" as const,
    classNames: {
      circle1: "border-b-[#06B7DB]",
      circle2: "border-b-[#06B7DB]"
    }
  };

  // Merge default props with any custom props passed in
  return <NextUISpinner {...defaultProps} {...props} />;
};

export default Spinner; 