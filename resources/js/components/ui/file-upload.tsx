import * as React from "react"
import { cn } from "@/lib/utils"
import { Upload, X, FileText, Loader2 } from "lucide-react"
import { Button } from "./button"

interface FileUploadProps {
    onFileSelect: (file: File) => void
    acceptedTypes?: string
    maxSize?: number // in MB
    className?: string
    disabled?: boolean
    isProcessing?: boolean
}

export function FileUpload({
    onFileSelect,
    acceptedTypes = "image/*,.pdf",
    maxSize = 10,
    className,
    disabled = false,
    isProcessing = false,
}: FileUploadProps) {
    const [isDragging, setIsDragging] = React.useState(false)
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!disabled && !isProcessing) {
            setIsDragging(true)
        }
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        if (disabled || isProcessing) return

        const files = Array.from(e.dataTransfer.files)
        if (files.length > 0) {
            handleFile(files[0])
        }
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0])
        }
    }

    const handleFile = (file: File) => {
        // Validate file type
        const allowedTypes = acceptedTypes.split(',').map(type => type.trim())
        const fileType = file.type
        const fileName = file.name.toLowerCase()
        
        const isValidType = allowedTypes.some(type => {
            if (type.includes('*')) {
                const baseType = type.split('/')[0]
                return fileType.startsWith(baseType + '/')
            }
            return fileType === type || fileName.endsWith(type.replace('.', ''))
        })

        if (!isValidType) {
            alert(`Invalid file type. Please upload ${acceptedTypes}`)
            return
        }

        // Validate file size
        const fileSizeMB = file.size / (1024 * 1024)
        if (fileSizeMB > maxSize) {
            alert(`File size exceeds ${maxSize}MB limit`)
            return
        }

        setSelectedFile(file)
        onFileSelect(file)
    }

    const handleRemoveFile = () => {
        setSelectedFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleClick = () => {
        if (!disabled && !isProcessing) {
            fileInputRef.current?.click()
        }
    }

    return (
        <div className={cn("w-full", className)}>
            <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
                className={cn(
                    "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    isDragging && "border-primary bg-primary/5",
                    !isDragging && "border-muted-foreground/25 hover:border-primary/50",
                    disabled && "opacity-50 cursor-not-allowed",
                    isProcessing && "opacity-50 cursor-wait"
                )}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedTypes}
                    onChange={handleFileInput}
                    className="hidden"
                    disabled={disabled || isProcessing}
                />

                {isProcessing ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Processing document...</p>
                    </div>
                ) : selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-primary" />
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveFile()
                            }}
                            className="mt-2"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Remove
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">
                                Drag and drop a file here, or click to select
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Supports images (JPEG, PNG, WebP) and PDF files up to {maxSize}MB
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

