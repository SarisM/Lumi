import { motion } from "motion/react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { User } from "lucide-react";
import { useState } from "react";
import { useUser } from "../contexts/UserContext";

interface ProfileSetupScreenProps {
  onNext: () => void;
}

export function ProfileSetupScreen({ onNext }: ProfileSetupScreenProps) {
  const { setUserProfile } = useUser();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    weight: "",
    height: "",
    activityLevel: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Form submitted with data:", formData);
    
    if (!isFormValid()) {
      console.log("Form is not valid");
      return;
    }
    
    const profile = {
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender as "male" | "female" | "other",
      weight: parseFloat(formData.weight),
      height: parseFloat(formData.height),
      activityLevel: formData.activityLevel as "sedentary" | "light" | "moderate" | "very",
    };

    console.log("Saving profile:", profile);
    
    try {
      await setUserProfile(profile);
      console.log("Profile saved successfully");
      onNext();
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const handleChange = (field: string, value: string) => {
    console.log(`Field ${field} changed to:`, value);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    const isValid = !!(
      formData.name.trim() &&
      formData.age &&
      formData.gender &&
      formData.weight &&
      formData.height &&
      formData.activityLevel
    );
    console.log("Form validation:", { formData, isValid });
    return isValid;
  };

  return (
    <div className="relative h-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 overflow-hidden">
      {/* Animated background */}
      <motion.div
        className="absolute top-1/4 right-0 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
        }}
      />

      <div className="relative h-full overflow-y-auto p-6 pb-24">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-8 mt-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <User className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-gray-800 mb-2">
              Create Your Profile
            </h1>
            <p className="text-sm text-gray-600">
              Help us personalize your wellness journey
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="bg-white/80 backdrop-blur-md border-white/50"
              />
            </div>

            {/* Age and Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="120"
                  placeholder="25"
                  value={formData.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  className="bg-white/80 backdrop-blur-md border-white/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleChange("gender", value)}
                >
                  <SelectTrigger className="bg-white/80 backdrop-blur-md border-white/50">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Weight and Height */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="1"
                  max="500"
                  step="0.1"
                  placeholder="70"
                  value={formData.weight}
                  onChange={(e) => handleChange("weight", e.target.value)}
                  className="bg-white/80 backdrop-blur-md border-white/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  min="1"
                  max="300"
                  placeholder="170"
                  value={formData.height}
                  onChange={(e) => handleChange("height", e.target.value)}
                  className="bg-white/80 backdrop-blur-md border-white/50"
                />
              </div>
            </div>

            {/* Activity Level */}
            <div className="space-y-2">
              <Label htmlFor="activity">Activity Level</Label>
              <Select
                value={formData.activityLevel}
                onValueChange={(value) => handleChange("activityLevel", value)}
              >
                <SelectTrigger className="bg-white/80 backdrop-blur-md border-white/50">
                  <SelectValue placeholder="Select your activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
                  <SelectItem value="light">Light (1-3 days/week)</SelectItem>
                  <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
                  <SelectItem value="very">Very Active (6-7 days/week)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!isFormValid()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full disabled:opacity-50"
            >
              Continue
            </Button>
          </motion.form>

          {/* Info card */}
          <motion.div
            className="mt-6 p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-xs text-gray-600 text-center">
              🔒 Your data is private and stored securely. We use this
              information to calculate your personalized daily goals.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
