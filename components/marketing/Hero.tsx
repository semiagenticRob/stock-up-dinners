import Image from "next/image";
import { SignupForm } from "./SignupForm";
import { MealGridPreview } from "./MealGridPreview";

export function Hero() {
  return (
    <>
      <div className="hero">
        <div className="hero__text">
          <p className="hero__meta">
            1&nbsp;COSTCO&nbsp;TRIP &nbsp;·&nbsp; COOK&nbsp;A&nbsp;LA&nbsp;CARTE &nbsp;·&nbsp; 14&nbsp;DINNERS&nbsp;&amp;&nbsp;GROWING
          </p>
          <h1>The easiest meals for Costco members.</h1>
          <p className="hero__sub">
            No more 4:50PM panic and hungry kids yelling:{" "}
            <em>&ldquo;What are we having for dinner tonight!?&rdquo;</em>
          </p>
          <p className="hero__sub">
            Built around Costco staples. One warehouse run, a pantry that tracks itself, and a quick
            dinner every night — you always know what to cook.
          </p>
          <SignupForm variant="hero" />
        </div>
        <div className="hero__media" aria-hidden="true">
          <Image
            src="/images/hero-pasta.jpg"
            alt=""
            width={1024}
            height={1024}
            priority
          />
        </div>
      </div>
      <MealGridPreview />
    </>
  );
}
