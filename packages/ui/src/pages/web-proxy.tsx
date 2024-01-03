export default function WebProsy() {
  return (
    <div className="h-full">
      <h1 className="text-[30px]">web-proxy</h1>

      <iframe
        src="/proxy?url=https://inet-ip.info/"
        width="100%"
        height="100%"
      ></iframe>
    </div>
  )
}
