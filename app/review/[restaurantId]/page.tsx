// The route's server side: owns route segment config, then hands params to the client screen.
// "instant = false" tells the build: this page's data is live, do not pre-bake it.
import ReviewScreen from "./screen";

export const instant = false;

export default function Page({ params }: PageProps<"/review/[restaurantId]">) {
  return <ReviewScreen params={params} />;
}
