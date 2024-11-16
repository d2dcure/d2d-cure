import { Spinner as NextUISpinner, SpinnerProps } from "@nextui-org/react";

const Spinner = (props: SpinnerProps) => {
  const defaultProps = {
    size: "lg" as const,
    classNames: {
      circle1: "border-b-[#06B7DB]",
      circle2: "border-b-[#06B7DB]"
    }
  };

  // Spread props first, then defaultProps as fallback
  return <NextUISpinner {...props} {...defaultProps} />;
};

export default Spinner; 