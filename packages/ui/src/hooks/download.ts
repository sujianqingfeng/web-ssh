export function useDownload() {
  const downloadByBlob = (fileName: string, data: ArrayBuffer) => {
    const blob = new Blob([data], { type: 'application/octet-stream' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return {
    downloadByBlob
  }
}
