import Layout from "@/components/Layout";
import aboutImg from "@/assets/about-story.jpg";
import { Leaf, Heart, Award, Users } from "lucide-react";

const values = [
  { icon: Leaf, title: "100% Natural", desc: "We never use chemicals, fillers, or artificial colors. Every product is as pure as it gets." },
  { icon: Heart, title: "Farm Direct", desc: "We source directly from small-scale farmers, ensuring fair prices and fresh quality." },
  { icon: Award, title: "Quality First", desc: "Every batch is lab-tested for purity, potency, and safety before it reaches you." },
  { icon: Users, title: "Community", desc: "We support farming communities and promote sustainable agriculture practices." },
];

const About = () => (
  <Layout>
    <section className="py-12 md:py-16">
      <div className="container">
        <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">Our Story</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          How a passion for authentic flavors became SpiceRoot
        </p>
      </div>
    </section>

    <section className="bg-secondary py-16">
      <div className="container grid items-center gap-10 md:grid-cols-2">
        <img src={aboutImg} alt="Our spice sourcing journey" className="rounded-xl object-cover" loading="lazy" />
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">From Fields to Flavor</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            SpiceRoot was born from a simple frustration — the inability to find truly pure, unadulterated spice powders in the market. In 2018, our founder traveled across India's spice-growing regions, meeting farmers and learning the art of traditional stone-grinding.
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Today, we partner with over 50 small-scale farming families across Kerala, Karnataka, Rajasthan, and the Northeast. Every spice is sourced at peak freshness, stone-ground in small batches, and packed without any additives or preservatives.
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Our mission is simple: to bring the authentic taste of India's farmlands into your kitchen, while supporting the communities that make it all possible.
          </p>
        </div>
      </div>
    </section>

    <section className="py-16">
      <div className="container">
        <h2 className="text-center font-serif text-3xl font-bold text-foreground">Our Values</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div key={v.title} className="rounded-xl border border-border bg-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <v.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </Layout>
);

export default About;
