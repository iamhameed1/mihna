import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  CircleAlert,
  FileText,
  Globe2,
  Link2,
  MapPin,
  Pencil,
  Save,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function AddJobPage({
  onAddJob,
  editingJob,
  onUpdateJob,
  onCancelEdit,
}) {
  const [formData, setFormData] = useState({
    title: editingJob?.title || "",
    company: editingJob?.company || "",
    country: editingJob?.country || "",
    city: editingJob?.city || "",
    type: editingJob?.type || "Onsite",
    salary: editingJob?.salary || "",
    link: editingJob?.link || "",
    description: editingJob?.description || "",
  });

  const [formError, setFormError] = useState("");

  /*
   * Keep the form synchronized if a different job
   * becomes the active editing job.
   */
  useEffect(() => {
    setFormData({
      title: editingJob?.title || "",
      company: editingJob?.company || "",
      country: editingJob?.country || "",
      city: editingJob?.city || "",
      type: editingJob?.type || "Onsite",
      salary: editingJob?.salary || "",
      link: editingJob?.link || "",
      description: editingJob?.description || "",
    });

    setFormError("");
  }, [editingJob]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleTypeChange(value) {
    setFormData((current) => ({
      ...current,
      type: value,
    }));
  }

  function validateForm() {
    if (formData.title.trim().length < 3) {
      return "Job title must be at least 3 characters.";
    }

    if (formData.company.trim().length < 2) {
      return "Company name must be at least 2 characters.";
    }

    if (formData.country.trim().length < 2) {
      return "Country must be at least 2 characters.";
    }

    if (formData.city.trim().length < 2) {
      return "City must be at least 2 characters.";
    }

    if (!formData.salary.trim()) {
      return "Salary is required.";
    }

    if (
      !formData.link.startsWith("http://") &&
      !formData.link.startsWith("https://")
    ) {
      return "Company website link must start with http:// or https://";
    }

    if (formData.description.trim().length < 10) {
      return "Description must be at least 10 characters.";
    }

    return "";
  }

  function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError("");

    if (editingJob) {
      onUpdateJob(editingJob.id, formData);
    } else {
      onAddJob(formData);
    }
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <section>
        <Badge variant="secondary" className="mb-3">
          {editingJob ? (
            <Pencil className="size-3.5" />
          ) : (
            <BriefcaseBusiness className="size-3.5" />
          )}

          Company Workspace
        </Badge>

        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {editingJob ? "Edit Job" : "Post a Job"}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          {editingJob
            ? "Update the details of your existing opportunity."
            : "Publish a new opportunity and make it available to job seekers on Mihna."}
        </p>
      </section>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main form */}
          <div className="space-y-6">
            {formError && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />

                <p>{formError}</p>
              </div>
            )}

            {/* Position */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BriefcaseBusiness className="size-4 text-primary" />
                  Position
                </CardTitle>

                <CardDescription>
                  Basic information about the role and company.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-5 md:grid-cols-2">
                <FormField
                  label="Job title"
                  htmlFor="title"
                  icon={BriefcaseBusiness}
                >
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Data Engineer"
                    required
                  />
                </FormField>

                <FormField
                  label="Company"
                  htmlFor="company"
                  icon={Building2}
                >
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="e.g. Mihna Technologies"
                    required
                  />
                </FormField>
              </CardContent>
            </Card>

            {/* Location & employment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="size-4 text-primary" />
                  Location & Employment
                </CardTitle>

                <CardDescription>
                  Define where and how this role is performed.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-5 md:grid-cols-2">
                <FormField
                  label="Country"
                  htmlFor="country"
                  icon={Globe2}
                >
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="e.g. Saudi Arabia"
                    required
                  />
                </FormField>

                <FormField
                  label="City"
                  htmlFor="city"
                  icon={MapPin}
                >
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Riyadh"
                    required
                  />
                </FormField>

                <FormField
                  label="Work type"
                  htmlFor="type"
                  icon={BriefcaseBusiness}
                >
                  <Select
                    value={formData.type}
                    onValueChange={handleTypeChange}
                  >
                    <SelectTrigger id="type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="Onsite">
                        Onsite
                      </SelectItem>

                      <SelectItem value="Hybrid">
                        Hybrid
                      </SelectItem>

                      <SelectItem value="Remote">
                        Remote
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="Salary"
                  htmlFor="salary"
                  icon={WalletCards}
                >
                  <Input
                    id="salary"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="e.g. SAR 12,000 – 16,000"
                    required
                  />
                </FormField>
              </CardContent>
            </Card>

            {/* Application */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Link2 className="size-4 text-primary" />
                  Application
                </CardTitle>

                <CardDescription>
                  Where candidates can learn more or apply.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <FormField
                  label="Company website or application link"
                  htmlFor="link"
                  icon={Link2}
                >
                  <Input
                    id="link"
                    name="link"
                    value={formData.link}
                    onChange={handleChange}
                    type="url"
                    placeholder="https://company.com/jobs/role"
                    required
                  />
                </FormField>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="size-4 text-primary" />
                  Job Description
                </CardTitle>

                <CardDescription>
                  Describe the role, responsibilities, requirements,
                  and anything candidates should know.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the opportunity..."
                  required
                  rows={10}
                  className="flex min-h-56 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />

                <div className="mt-2 flex justify-end">
                  <span className="text-xs text-muted-foreground">
                    {formData.description.length} characters
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Mobile actions */}
            <div className="flex flex-col-reverse gap-2 sm:flex-row xl:hidden">
              {editingJob && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancelEdit}
                  className="sm:flex-1"
                >
                  Cancel
                </Button>
              )}

              <Button
                type="submit"
                className="sm:flex-1"
              >
                <Save className="size-4" />

                {editingJob
                  ? "Update Job"
                  : "Publish Job"}
              </Button>
            </div>
          </div>

          {/* Desktop side panel */}
          <aside className="hidden xl:block">
            <div className="sticky top-24 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {editingJob
                      ? "Update opportunity"
                      : "Publish opportunity"}
                  </CardTitle>

                  <CardDescription>
                    Review the information before saving.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <SummaryRow
                    label="Position"
                    value={
                      formData.title ||
                      "Not entered"
                    }
                  />

                  <SummaryRow
                    label="Company"
                    value={
                      formData.company ||
                      "Not entered"
                    }
                  />

                  <SummaryRow
                    label="Location"
                    value={
                      formData.city &&
                      formData.country
                        ? `${formData.city}, ${formData.country}`
                        : "Not entered"
                    }
                  />

                  <SummaryRow
                    label="Work type"
                    value={formData.type}
                  />

                  <div className="border-t pt-4">
                    <Button
                      type="submit"
                      className="w-full"
                    >
                      <Save className="size-4" />

                      {editingJob
                        ? "Update Job"
                        : "Publish Job"}
                    </Button>

                    {editingJob && (
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-2 w-full"
                        onClick={onCancelEdit}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-xs leading-5 text-muted-foreground">
                  Company jobs are published directly to Mihna
                  and remain editable by the company account
                  that created them.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  htmlFor,
  icon: Icon,
  children,
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-2 text-sm font-medium"
      >
        {Icon && (
          <Icon className="size-3.5 text-muted-foreground" />
        )}

        {label}
      </label>

      {children}
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium">
        {value}
      </p>
    </div>
  );
}

export default AddJobPage;