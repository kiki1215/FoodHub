import foodPlatter from '../../assets/food-platter.svg';

export default function AuthBanner({ titleLine1, titleLine2, subtitle }) {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#F98B2C] via-[#F47721] to-[#E25F0D] p-8 text-white sm:p-10">
      {/* Decorative soft curves matching login.png / register.png */}
      <div className="pointer-events-none absolute -right-16 top-1/3 h-64 w-64 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-72 w-72 rounded-full bg-black/5" />

      <div className="relative z-10">
        <h2 className="text-2xl font-extrabold leading-snug sm:text-3xl">
          {titleLine1}
          <br />
          {titleLine2}
        </h2>
        <p className="mt-2.5 text-sm font-medium text-white/95 sm:text-base">
          {subtitle} <span aria-hidden="true">✨</span>
        </p>
      </div>

      <div className="relative z-10 my-6 flex items-center justify-center">
        <img
          src={foodPlatter}
          alt="Món ngon FOODHUB"
          className="h-auto w-full max-w-[300px] drop-shadow-xl transition duration-300 hover:scale-[1.02]"
        />
      </div>

      <p className="relative z-10 text-center text-xs font-medium text-white/90 sm:text-sm">
        Hàng ngàn món ngon đang chờ bạn khám phá
      </p>
    </div>
  );
}
